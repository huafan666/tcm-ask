// core/session.js
// 辨证会话封装：把 run-mvp.js 的 CLI 交互逻辑抽成可复用的 Session 类，
// 供 Web 服务器 / 其它界面调用。逻辑与 CLI 完全一致，只是把"打印"换成返回结构化状态。
//
// 典型流程：newSession() → input(描述) → 可能返回反问问题 → answer(1/2/3) → … → 收敛交付结果 → 进入 chat
const { Engine } = require('../engine/engine')
const { Asker } = require('../engine/asker')
const { summarizeSymptoms, explainResult, freeChat } = require('../llm/wrap')
const { applyStructured } = require('../llm/structured')

class Session {
  constructor(registry, opts = {}) {
    this.registry = registry
    this.opts = opts
    // 大模型配置：undefined=用环境变量（CLI/独立服务的老行为）；
    // 对象={apiKey,baseUrl,model}=用这套（云平台按账号隔离）；false=明确不用大模型
    this.llm = opts.llm
    this.engine = new Engine(registry)
    this.asker = new Asker(this.engine)
    this.snapshotStack = []
    this.pendingQuestion = null
    this.mode = 'diagnose'   // 'diagnose' | 'chat'
    this.concluded = false
    this.chatHistory = []
    this._busy = false       // LLM 调用中，防止并发重复处理
  }

  // ---------- 撤回 ----------
  _takeSnapshot() {
    this.snapshotStack.push({
      state: JSON.parse(JSON.stringify(this.engine.state)),
      asked: new Set(this.asker.asked),
      pending: this.pendingQuestion
    })
    if (this.snapshotStack.length > 50) this.snapshotStack.shift()
  }
  _undo() {
    const snap = this.snapshotStack.pop()
    if (!snap) return false
    this.engine.state = snap.state
    this.asker.asked = snap.asked
    this.pendingQuestion = snap.pending
    return true
  }

  // ---------- 状态渲染 ----------
  stateLines() {
    const lines = []
    for (const name of Object.keys(this.engine.registry).sort()) {
      const s = this.engine.state[name]
      if (s === 'unknown') continue
      lines.push({ yes: s === 'yes', title: this.engine.registry[name].title })
    }
    return lines
  }
  stateText() {
    // 和 CLI 的 renderState 一致，供 LLM 用
    const lines = ['状态:']
    for (const name of Object.keys(this.engine.registry).sort()) {
      const s = this.engine.state[name]
      if (s === 'unknown') continue
      const st = s === 'yes' ? '  ✓ yes' : '  ✗ no '
      lines.push(`${st} ${this.engine.registry[name].title} (${name})`)
    }
    const contra = this.engine.contraindications()
    if (contra.length) {
      lines.push('注意事项/禁忌:')
      contra.forEach(c => lines.push(`   - ${c}`))
    }
    return lines.join('\n')
  }

  // ---------- 收敛判断 ----------
  isResolved() {
    const c = this.asker.candidates()
    if (c.length === 0 || c.length === 1) return true
    return !this.asker.nextQuestion()
  }

  // 当前待问问题(合成给前端展示的结构)
  _questionView(q, candCount) {
    if (!q) return null
    return {
      leaf: q.leaf,
      title: q.title,
      phrase: q.phrase,
      candidates: candCount,
      // isGroup=true 表示这是「症状筛选」粗筛问题（部位/大类），不是具体症状
      isGroup: !!q.isGroup,
      // isSystem=true 表示这是十问歌顺序的「系统闸门」问题（寒热/汗/二便/睡眠…）
      isSystem: !!q.isSystem,
      systemTitle: q.systemTitle || null,
      inFocus: !!q.inFocus,
      inSystem: q.inSystem || null,
      covers: q.covers || null
    }
  }
  _nextQuestionView() {
    const cands = this.asker.candidates()
    const q = this.asker.nextQuestion()
    this.pendingQuestion = q
    return { question: this._questionView(q, cands.length), candidateCount: cands.length }
  }

  // ---------- 主入口：喂一段输入(描述或 1/2/3 或 撤回) ----------
  // 返回 { view, done, error }
  async input(text) {
    if (this._busy) return { error: '上一步还没处理完，请稍候' }
    this._busy = true
    try {
      const lower = String(text || '').replace(/\s+/g, '').toLowerCase()

      // 撤回
      if (['back', 'undo', 'z', '撤回', '撤销', '返回', '回上一步', '上一步'].includes(lower)) {
        const ok = this._undo()
        if (!ok) {
          const v = this._nextQuestionView()
          return { view: v, note: '没有可撤回的上一步' }
        }
        const v = this._nextQuestionView()
        return { view: v, undone: true, state: this.stateLines() }
      }

      this._takeSnapshot()

      // 反问三选
      if (this.pendingQuestion) {
        const p = this.pendingQuestion
        if (lower === '1' || lower === '是' || lower === 'yes' || lower === '有') {
          this.engine.setDirect(p.leaf, 'yes')
          // 对「症状筛选组」答是 → 锁定这个部位/大类，后续只在它内部细化
          if (p.isGroup) this.asker.focusGroup(p.leaf)
          // 系统闸门答「有」但病人没具体说 → 记下来，稍后追问几个关键子症状
          if (p.isSystem) this.asker.markGateYes(p.leaf)
        } else if (lower === '2' || lower === '否' || lower === 'no' || lower === '没有' || lower === '无') {
          // 对组答否 → 引擎会把该组所有子症状一次性置为 no（析取否定）
          this.engine.setDirect(p.leaf, 'no')
        } else if (lower === '3' || lower === '不知道' || lower === '不清楚' || lower === '模糊' || lower === '也许') {
          this.asker.markAsked(p.leaf)
        } else {
          // 用户没按按钮而是描述 → 当作自由描述处理
          this.pendingQuestion = null
          await this._feedDesc(text)
        }
        // 粗筛问题记一次额度
        if (p.isGroup && (lower === '1' || lower === '是' || lower === 'yes' || lower === '有' ||
          lower === '2' || lower === '否' || lower === 'no' || lower === '没有' || lower === '无' ||
          lower === '3' || lower === '不知道' || lower === '不清楚' || lower === '模糊' || lower === '也许')) {
          this.asker.groupAskedCount += 1
        }
      } else {
        await this._feedDesc(text)
      }

      // 检查收敛
      if (!this.isResolved()) {
        const v = this._nextQuestionView()
        return { view: v, state: this.stateLines() }
      }

      // 收敛交付
      await this._conclude()
      return { view: { finished: true }, state: this.stateLines(), result: this.result }
    } finally {
      this._busy = false
    }
  }

  // 处理口头描述（走 LLM 整理）
  async _feedDesc(text) {
    let structured = text
    try {
      const pool = Object.values(this.registry)
        .filter(p => p.kind === 'symptom')
        .map(p => p.title)
      structured = await summarizeSymptoms(text, pool, this.llm)
    } catch (_) {}
    // 判断是不是 LLM 输出的三态标记格式；是则按行解析，否则退回原文 feed
    const llmStructured = typeof structured === 'string' && /【肯定】|【否定】|【模糊】/.test(structured)
    if (llmStructured) {
      applyStructured(this.engine, this.registry, structured)
    } else {
      this.engine.feed(structured)
    }
  }

  // ---------- 收敛交付 ----------
  async _conclude() {
    const resultText = this.stateText()
    let explanation = resultText
    try {
      explanation = await explainResult(resultText, this.llm)
    } catch (_) {}
    // 提取已成立的方剂名供前端展示
    const yesFormulas = Object.entries(this.engine.state)
      .filter(([n, s]) => s === 'yes' && this.registry[n] && this.registry[n].kind === 'formula')
      .map(([n]) => ({ name: n, title: this.registry[n].title }))
    const contra = this.engine.contraindications()
    this.result = {
      formulas: yesFormulas,
      explanation,
      contraindications: contra,
      state: this.stateLines()
    }
    this.chatHistory = [{ role: 'system', content: '已完成辨证，结果为：' + resultText }]
    this.mode = 'chat'
    this.concluded = true
  }

  // ---------- 进对话模式（收敛后） ----------
  async chat(text) {
    try {
      this.chatHistory.push({ role: 'user', content: text })
      const reply = await freeChat(this.chatHistory, text, this.llm)
      this.chatHistory.push({ role: 'assistant', content: reply })
      return { reply }
    } catch (_) {
      return { reply: '(解释区需要配置 LLM_KEY 才能使用)' }
    }
  }

  // ---------- 重启 ----------
  restart() {
    this.engine = new Engine(this.registry)
    this.asker = new Asker(this.engine)
    this.snapshotStack = []
    this.pendingQuestion = null
    this.mode = 'diagnose'
    this.concluded = false
    this.chatHistory = []
    this.result = null
    return this._nextQuestionView()
  }

  hasLLM() {
    if (this.llm === false) return false
    if (this.llm && this.llm.apiKey) return true
    return !!process.env.LLM_KEY
  }
}

module.exports = { Session }
