'use strict'
// platform/consult.js
// ============================================================
// 把现有的辨证会话（core/session.js）挂到平台里：
//   · 每个浏览器会话一个 Session（内存里），带过期清理
//   · 收敛出结论时，把结果落进 consults 表 → 患者「我的辨证记录」
//
// 注意：诊断逻辑一行没改，这里只是外面套了「多用户 + 存档」的壳。
// ============================================================

const { Session } = require('../core/session')
const { q, now } = require('./db')
const llmconfig = require('./llmconfig')

const TTL_MS = 2 * 3600 * 1000     // 2 小时没动静就回收
const MAX_SESSIONS = 500

class ConsultStore {
  constructor(registry) {
    this.registry = registry
    this.sessions = new Map()      // sid -> { session, userId, firstText, createdAt, touchedAt, saved }
  }

  _gc() {
    const nowMs = Date.now()
    for (const [sid, rec] of this.sessions) {
      if (nowMs - rec.touchedAt > TTL_MS) this.sessions.delete(sid)
    }
    if (this.sessions.size > MAX_SESSIONS) {
      const oldest = [...this.sessions.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt)
      for (const [sid] of oldest.slice(0, this.sessions.size - MAX_SESSIONS)) this.sessions.delete(sid)
    }
  }

  create(userId) {
    this._gc()
    const sid = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    // 每个会话用的是「这个账号自己的」大模型配置（没配就是 false = 纯规则辨证）
    const session = new Session(this.registry, { llm: llmconfig.resolve(userId) })
    this.sessions.set(sid, {
      session, userId: userId || null, firstText: '', createdAt: now(), touchedAt: Date.now(), saved: false
    })
    return { sid, session }
  }

  get(sid) {
    const rec = this.sessions.get(sid)
    if (!rec) return null
    rec.touchedAt = Date.now()
    return rec
  }

  /** 换账号登录后，把匿名会话认领到当前用户名下（可选项，前端会调用） */
  claim(sid, userId) {
    const rec = this.sessions.get(sid)
    if (rec && userId) {
      rec.userId = userId
      rec.session.llm = llmconfig.resolve(userId)
    }
  }

  /** 每次输入前刷新一次：用户中途去设置里换了 key，本次会话立刻生效 */
  _refreshLlm(rec) {
    rec.session.llm = llmconfig.resolve(rec.userId)
    return rec
  }

  async input(sid, text) {
    const rec = this.get(sid)
    if (!rec) return null
    this._refreshLlm(rec)
    if (!rec.firstText && text && !/^[123是否有无不清楚不知道]$/.test(String(text).trim())) {
      rec.firstText = String(text).slice(0, 500)
    }
    const r = await rec.session.input(text)
    if (r && r.result) this._save(rec, sid, r.result)
    return r
  }

  async chat(sid, text) {
    const rec = this.get(sid)
    if (!rec) return null
    this._refreshLlm(rec)
    return rec.session.chat(text)
  }

  restart(sid) {
    const rec = this.get(sid)
    if (!rec) return null
    rec.saved = false
    rec.firstText = ''
    return rec.session.restart()
  }

  _save(rec, sid, result) {
    if (rec.saved) return
    rec.saved = true
    const formulas = (result.formulas || []).map(f => f.title)
    const summary = formulas.length ? formulas.slice(0, 4).join(' / ') : '未收敛到具体方剂'
    try {
      q.run(
        `INSERT OR REPLACE INTO consults (id, user_id, input_text, summary, result_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        sid, rec.userId, rec.firstText, summary, JSON.stringify({
          formulas: result.formulas || [],
          explanation: result.explanation || '',
          contraindications: result.contraindications || [],
          state: result.state || []
        }), now()
      )
    } catch (e) {
      console.error('[consult] 存档失败:', e.message)
    }
  }

  /** 把某个匿名会话的存档归属到刚登录的用户 */
  attachRecords(sid, userId) {
    if (!sid || !userId) return
    q.run('UPDATE consults SET user_id = ? WHERE id = ? AND user_id IS NULL', sid, userId)
  }
}

function historyOf(userId, limit) {
  const rows = q.all(
    'SELECT * FROM consults WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    Number(userId), Number(limit || 20))
  return rows.map(r => {
    let parsed = {}
    try { parsed = JSON.parse(r.result_json) } catch (_) {}
    return {
      id: r.id,
      inputText: r.input_text,
      summary: r.summary,
      formulas: parsed.formulas || [],
      contraindications: parsed.contraindications || [],
      createdAt: r.created_at
    }
  })
}

function historyDetail(id, userId) {
  const r = q.get('SELECT * FROM consults WHERE id = ? AND user_id = ?', String(id), Number(userId))
  if (!r) return null
  let parsed = {}
  try { parsed = JSON.parse(r.result_json) } catch (_) {}
  return {
    id: r.id,
    inputText: r.input_text,
    summary: r.summary,
    createdAt: r.created_at,
    formulas: parsed.formulas || [],
    explanation: parsed.explanation || '',
    contraindications: parsed.contraindications || [],
    state: parsed.state || []
  }
}

module.exports = { ConsultStore, historyOf, historyDetail }
