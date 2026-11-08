// platform/public/js/settings.js
// 每个账号自己的大模型 API 配置（默认 DeepSeek，服务端加密保存）
import { api } from './api.js'
import { bootShell, esc, timeAgo, toast, $ } from './shell.js'

const shell = await bootShell('settings', { requireLogin: true })
const user = shell.user

let cfg = null
try { cfg = (await api.llmConfig()).config } catch (e) { toast(e.message, 'err') }

const SOURCE_TEXT = {
  user: '<span class="badge badge-ok">正在用我的 Key</span>',
  server: '<span class="badge badge-soft">用服务器默认 Key</span>',
  none: '<span class="badge badge-no">未配置 · 纯规则辨证</span>'
}

function render() {
  const c = cfg || {}
  const models = (c.providers && c.providers[0] && c.providers[0].models) || ['deepseek-chat', 'deepseek-reasoner']
  const isCustomModel = c.model && !models.includes(c.model)

  $('#llm-slot').innerHTML = `
    <div class="card">
      <div class="spread" style="align-items:flex-start">
        <div>
          <h3>大模型 API 配置</h3>
          <div class="small muted" style="margin-top:4px">
            用来把病人口语整理成症状、把辨证结果解释成大白话。不配置也能问诊，只是没有 AI 解释。
          </div>
        </div>
        ${SOURCE_TEXT[c.source] || SOURCE_TEXT.none}
      </div>

      <div class="hr"></div>

      <div class="stack">
        <div class="field">
          <label class="label">服务商</label>
          <select class="select" id="f-provider" disabled>
            <option value="deepseek" selected>DeepSeek（推荐，deepseek-chat 最便宜）</option>
          </select>
          <div class="hint">目前只内置 DeepSeek；用中转/自建兼容接口时改下面的 Base URL 即可。</div>
        </div>

        <div class="field">
          <label class="label">API Key</label>
          <input class="input" id="f-key" type="password" autocomplete="off" spellcheck="false"
                 placeholder="${c.configured ? '已保存 ' + esc(c.keyMask) + '，留空表示不修改' : 'sk-...（去 platform.deepseek.com 申请）'}">
          <div class="hint">
            ${c.broken ? '<span style="color:#e0245e">之前的密文解不开了（可能换过主密钥），请重新填一次。</span>' : ''}
            加密后存在本机数据库，接口只返回掩码 <span class="mono">${esc(c.keyMask || '—')}</span>，任何人都读不到明文。
          </div>
        </div>

        <div class="field">
          <label class="label">Base URL</label>
          <input class="input" id="f-base" value="${esc(c.baseUrl || 'https://api.deepseek.com')}" spellcheck="false">
        </div>

        <div class="field">
          <label class="label">模型</label>
          <select class="select" id="f-model">
            ${models.map(m => `<option value="${m}" ${m === c.model ? 'selected' : ''}>${m}</option>`).join('')}
            <option value="__custom__" ${isCustomModel ? 'selected' : ''}>自定义…</option>
          </select>
          <input class="input ${isCustomModel ? '' : 'hidden'}" id="f-model-custom" value="${isCustomModel ? esc(c.model) : ''}"
                 placeholder="例如 deepseek-chat" style="margin-top:8px">
          <div class="hint">deepseek-chat 便宜够用；deepseek-reasoner 更强但更贵、更慢。</div>
        </div>

        <label class="row" style="cursor:pointer;user-select:none">
          <input type="checkbox" id="f-enabled" ${c.enabled ? 'checked' : ''}>
          <span class="small">启用（关掉后本次配置保留但不起作用）</span>
        </label>

        <div class="row-wrap" style="margin-top:4px">
          <button class="btn btn-primary" id="btn-save">保存</button>
          <button class="btn" id="btn-test">测试连接</button>
          ${c.configured ? '<button class="btn btn-danger" id="btn-clear">删除我的配置</button>' : ''}
          ${c.updatedAt ? `<span class="tiny dim">上次更新 ${timeAgo(c.updatedAt)}</span>` : ''}
        </div>

        <div id="test-result"></div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:10px">这套配置用在哪里</h3>
      <div class="small muted" style="line-height:1.9">
        · 问你自己的问诊会话用它（症状整理 + 结果解释 + 结论后的追问）。<br>
        · 别人登录他们的账号，用他们自己的配置，<b>彼此看不到、也用不到别人的 key</b>。<br>
        · 没配置的账号（含未登录访客）走纯规则辨证：问题照问、结论照出，只是没有 AI 解释。<br>
        · 费用记在你自己的 DeepSeek 账号上。
      </div>
      ${c.serverDefaultAvailable
        ? '<div class="hr"></div><div class="small muted">当前服务器开启了「.env 兜底」（<span class="mono">PLATFORM_ALLOW_ENV_LLM=1</span>）：没配 key 的账号会借用服务器那把 key。想彻底独立就别开这个开关。</div>'
        : '<div class="hr"></div><div class="small muted">服务器没有开启 .env 兜底，所以没配置 key 的账号一定不会调用大模型——「独立」是绝对的。</div>'}
    </div>`
  bind()
}

function currentModel() {
  const sel = $('#f-model').value
  if (sel !== '__custom__') return sel
  return $('#f-model-custom').value.trim()
}

function bind() {
  const sel = $('#f-model')
  sel.onchange = () => {
    const custom = $('#f-model-custom')
    custom.classList.toggle('hidden', sel.value !== '__custom__')
    if (sel.value === '__custom__') custom.focus()
  }

  $('#btn-save').onclick = async () => {
    const btn = $('#btn-save')
    btn.disabled = true
    try {
      const body = {
        provider: 'deepseek',
        baseUrl: $('#f-base').value.trim(),
        model: currentModel(),
        enabled: $('#f-enabled').checked
      }
      const key = $('#f-key').value.trim()
      if (key) body.apiKey = key
      const r = await api.llmSave(body)
      cfg = r.config
      toast('已保存', 'ok')
      render()
    } catch (e) {
      toast(e.message, 'err', 6000)
      btn.disabled = false
    }
  }

  $('#btn-test').onclick = async () => {
    const box = $('#test-result')
    box.innerHTML = '<div class="small muted">正在连接…</div>'
    try {
      const body = { baseUrl: $('#f-base').value.trim(), model: currentModel() }
      const key = $('#f-key').value.trim()
      if (key) body.apiKey = key
      const r = await api.llmTest(body)
      if (r.ok) {
        const models = (r.models || []).slice(0, 6).join('、')
        box.innerHTML = `<div class="badge badge-ok">连接成功 · ${r.ms}ms</div>
          ${models ? `<div class="tiny dim" style="margin-top:6px">可用模型：${esc(models)}</div>` : ''}`
      } else {
        box.innerHTML = `<div class="badge badge-no">连接失败</div>
          <div class="small" style="margin-top:6px;color:#e0245e">${esc(r.error || ('HTTP ' + r.status))}</div>`
      }
    } catch (e) {
      box.innerHTML = `<div class="badge badge-no">测试失败</div><div class="small" style="margin-top:6px;color:#e0245e">${esc(e.message)}</div>`
    }
  }

  const clearBtn = $('#btn-clear')
  if (clearBtn) clearBtn.onclick = async () => {
    if (!confirm('确定删除你自己保存的 API Key？删掉后回到纯规则辨证。')) return
    try {
      const r = await api.llmClear()
      cfg = r.config
      toast('已删除', 'ok')
      render()
    } catch (e) { toast(e.message, 'err') }
  }
}

render()

$('#aside').innerHTML = `
  <div class="card">
    <h3 style="margin-bottom:10px">怎么拿 Key</h3>
    <div class="small muted" style="line-height:1.9">
      1. 打开 <span class="mono">platform.deepseek.com</span> 注册<br>
      2. 左侧「API keys」→ 新建<br>
      3. 复制 <span class="mono">sk-</span> 开头的那串，粘到左边<br>
      4. 点「测试连接」确认通，再「保存」
    </div>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">安全说明</h3>
    <div class="small muted" style="line-height:1.9">
      · 库里存的是 AES-256-GCM 密文，主密钥在 <span class="mono">platform/data/master.key</span>（本机、不入库）<br>
      · 所有接口只返回掩码，管理员也看不到你的明文<br>
      · 这是本地 demo：HTTP 明文传输，正式上线要加 HTTPS
    </div>
  </div>`
