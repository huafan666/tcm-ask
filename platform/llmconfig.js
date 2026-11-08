'use strict'
// platform/llmconfig.js
// ============================================================
// 每个账号一套自己的大模型 API 配置（默认 DeepSeek），互相独立。
//
//   · 明文 Key 只在服务器内存里出现，数据库存 AES-256-GCM 密文
//   · 接口永远不返回明文，只返回掩码（sk-abc••••wxyz）
//   · 没配置的人 → 走纯规则辨证（不做 AI 解释），不会偷用别人的 key
//   · 想让服务器 `.env` 的 key 兜底：环境变量 PLATFORM_ALLOW_ENV_LLM=1
// ============================================================

const { q, now } = require('./db')
const { encrypt, decrypt } = require('./secretstore')
const { HttpError } = require('./auth')

const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'] }
]
const DEFAULT_PROVIDER = 'deepseek'
const DEFAULT_BASE = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'
// 允许用服务器 .env 的 key 兜底（默认关闭，保证「独立」）
const ALLOW_ENV_FALLBACK = process.env.PLATFORM_ALLOW_ENV_LLM === '1'

function providerOf(id) {
  return PROVIDERS.find(p => p.id === id) || PROVIDERS[0]
}

function maskKey(key) {
  if (!key) return ''
  if (key.length <= 10) return '••••'
  return key.slice(0, 3) + '••••' + key.slice(-4)
}

function rowOf(userId) {
  return q.get('SELECT * FROM user_api_keys WHERE user_id = ?', Number(userId))
}

function normalizeBase(url) {
  const s = String(url || '').trim() || DEFAULT_BASE
  if (!/^https?:\/\//i.test(s)) throw new HttpError(400, 'Base URL 要写成 http(s):// 开头')
  return s.replace(/\/+$/, '')
}

function normalizeKey(key) {
  const s = String(key || '').trim()
  if (!s) throw new HttpError(400, 'API Key 不能为空')
  if (/\s/.test(s)) throw new HttpError(400, 'API Key 里不能有空格或换行')
  if (s.length < 8) throw new HttpError(400, 'API Key 太短，看起来不像真的')
  if (s.length > 200) throw new HttpError(400, 'API Key 太长')
  return s
}

function normalizeModel(model, provider) {
  const s = String(model || '').trim()
  if (!s) return providerOf(provider).models[0]
  if (s.length > 60) throw new HttpError(400, '模型名太长')
  return s
}

/** 给前端看的配置（永不含明文 key） */
function get(userId) {
  const r = rowOf(userId)
  const envAvailable = !!process.env.LLM_KEY
  const base = {
    providers: PROVIDERS.map(p => ({ id: p.id, name: p.name, baseUrl: p.baseUrl, models: p.models })),
    allowEnvFallback: ALLOW_ENV_FALLBACK,
    serverDefaultAvailable: ALLOW_ENV_FALLBACK && envAvailable
  }
  if (!r) {
    return Object.assign(base, {
      configured: false,
      enabled: false,
      provider: DEFAULT_PROVIDER,
      baseUrl: DEFAULT_BASE,
      model: DEFAULT_MODEL,
      keyMask: '',
      source: base.serverDefaultAvailable ? 'server' : 'none',
      updatedAt: null
    })
  }
  const plain = decrypt(r.key_cipher)
  const usable = !!plain && !!r.enabled
  return Object.assign(base, {
    configured: !!plain,
    enabled: !!r.enabled,
    provider: r.provider,
    baseUrl: r.base_url,
    model: r.model,
    keyMask: maskKey(plain),
    source: usable ? 'user' : (base.serverDefaultAvailable ? 'server' : 'none'),
    updatedAt: r.updated_at,
    // 说明：密文解不开（换过主密钥）时 configured=false，提示用户重填
    broken: !plain
  })
}

/** 保存/更新自己的配置；apiKey 留空表示「只改其它字段，key 不动」 */
function save(userId, input = {}) {
  const r = rowOf(userId)
  const provider = PROVIDERS.some(p => p.id === input.provider) ? input.provider : (r ? r.provider : DEFAULT_PROVIDER)
  const baseUrl = normalizeBase(input.baseUrl !== undefined ? input.baseUrl : (r ? r.base_url : DEFAULT_BASE))
  const model = normalizeModel(input.model !== undefined ? input.model : (r ? r.model : DEFAULT_MODEL), provider)
  const enabled = input.enabled === undefined ? (r ? !!r.enabled : true) : !!input.enabled

  let cipher = r ? r.key_cipher : null
  if (input.apiKey !== undefined && String(input.apiKey).trim() !== '') {
    cipher = encrypt(normalizeKey(input.apiKey))
  }
  if (!cipher) throw new HttpError(400, '还没有填 API Key')

  const stamp = now()
  if (r) {
    q.run(`UPDATE user_api_keys SET provider = ?, base_url = ?, model = ?, key_cipher = ?, enabled = ?, updated_at = ?
            WHERE user_id = ?`, provider, baseUrl, model, cipher, enabled ? 1 : 0, stamp, Number(userId))
  } else {
    q.run(`INSERT INTO user_api_keys (user_id, provider, base_url, model, key_cipher, enabled, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      Number(userId), provider, baseUrl, model, cipher, enabled ? 1 : 0, stamp, stamp)
  }
  return get(userId)
}

function clear(userId) {
  q.run('DELETE FROM user_api_keys WHERE user_id = ?', Number(userId))
  return get(userId)
}

function toggle(userId, enabled) {
  const r = rowOf(userId)
  if (!r) throw new HttpError(404, '还没有配置 API Key')
  q.run('UPDATE user_api_keys SET enabled = ?, updated_at = ? WHERE user_id = ?', enabled ? 1 : 0, now(), Number(userId))
  return get(userId)
}

/**
 * 解析出「这次调用真的要用哪把 key」。
 *   返回 { apiKey, baseUrl, model, source } 或 false（= 明确不用大模型）
 * Session 收到 false 时走纯规则辨证，不会偷偷回退到环境变量。
 */
function resolve(userId) {
  const r = rowOf(userId)
  if (r && r.enabled) {
    const plain = decrypt(r.key_cipher)
    if (plain) return { apiKey: plain, baseUrl: r.base_url, model: r.model, source: 'user' }
  }
  if (ALLOW_ENV_FALLBACK && process.env.LLM_KEY) {
    return {
      apiKey: process.env.LLM_KEY,
      baseUrl: (process.env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/+$/, ''),
      model: process.env.LLM_MODEL || DEFAULT_MODEL,
      source: 'server'
    }
  }
  return false
}

/** 连通性测试：带上这把 key 去问 DeepSeek 要模型列表（不消耗 token） */
async function test(cfg, timeoutMs = 12000) {
  const apiKey = String(cfg.apiKey || '').trim()
  if (!apiKey) throw new HttpError(400, '先填 API Key')
  const baseUrl = normalizeBase(cfg.baseUrl)
  const started = Date.now()
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const resp = await fetch(baseUrl + '/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: ac.signal
    })
    const ms = Date.now() - started
    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      let hint = text.slice(0, 200)
      if (resp.status === 401) hint = 'Key 无效或已失效（401）'
      else if (resp.status === 402) hint = '余额不足（402）'
      else if (resp.status === 403) hint = '没有权限（403）'
      else if (resp.status === 404) hint = 'Base URL 不对（404），DeepSeek 一般是 https://api.deepseek.com'
      return { ok: false, status: resp.status, ms, error: hint }
    }
    let models = []
    try {
      const data = JSON.parse(text)
      models = (data.data || []).map(m => m.id).filter(Boolean)
    } catch (_) {}
    return { ok: true, status: resp.status, ms, models }
  } catch (e) {
    const ms = Date.now() - started
    const msg = e.name === 'AbortError' ? `请求超时（>${timeoutMs}ms）` : ('连不上：' + e.message)
    return { ok: false, status: 0, ms, error: msg }
  } finally {
    clearTimeout(timer)
  }
}

/** 有没有任何可用的 key（用于首页/问诊页提示） */
function anyServerDefault() {
  return { allowEnvFallback: ALLOW_ENV_FALLBACK, envKeyPresent: !!process.env.LLM_KEY }
}

module.exports = {
  PROVIDERS,
  DEFAULT_BASE,
  DEFAULT_MODEL,
  ALLOW_ENV_FALLBACK,
  get,
  save,
  clear,
  toggle,
  resolve,
  test,
  anyServerDefault
}
