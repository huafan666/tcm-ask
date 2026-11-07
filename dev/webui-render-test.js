'use strict'
// dev/webui-render-test.js
// 直接执行 web/index.html 里的那支脚本（用极简 DOM 仿真 + 假 fetch），
// 验证「对话流 / 提问卡片 / 结论卡片 / 状态折叠」这些渲染路径真的能跑出来。
//
// 这是在没有浏览器的情况下，对客户界面最接近「点一遍」的验证。
//
// 用法： node dev/webui-render-test.js

const fs = require('node:fs')
const path = require('node:path')

let pass = 0
let fail = 0
const failures = []
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); return true }
  fail++
  failures.push(name + (detail ? '  → ' + detail : ''))
  console.log('  ✗ ' + name + (detail ? '  → ' + detail : ''))
  return false
}

// ------------------------------------------------------------
// 极简 DOM 仿真
// ------------------------------------------------------------
function makeClassList(el) {
  const set = new Set()
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    toggle: (c, f) => { const has = set.has(c); const want = f === undefined ? !has : !!f; if (want) set.add(c); else set.delete(c); return want },
    contains: c => set.has(c),
    get length() { return set.size },
    _set: set
  }
}

class El {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase()
    this.children = []
    this.attrs = {}
    this.style = { cssText: '' }
    this.dataset = {}
    this.classList = makeClassList(this)
    this._html = ''
    this._text = ''
    this.value = ''
    this.disabled = false
    this.hidden = false
    this.placeholder = ''
    this.title = ''
    this.scrollHeight = 60
    this.scrollTop = 0
    this._listeners = {}
    this._parent = null
  }
  get parentElement() { return this._parent || (this._parent = new El('div')) }
  set parentElement(v) { this._parent = v }
  get id() { return this.attrs.id || '' }
  set id(v) { this.attrs.id = String(v) }
  get innerHTML() { return this._html }
  set innerHTML(v) { this._html = String(v == null ? '' : v) }
  get textContent() { return this._text }
  set textContent(v) { this._text = String(v == null ? '' : v) }
  get className() { return this.attrs.class || '' }
  set className(v) {
    this.attrs.class = String(v)
    this.classList._set.clear()
    String(v).split(/\s+/).filter(Boolean).forEach(x => this.classList._set.add(x))
  }
  appendChild(c) {
    if (c && c.__frag) { c.children.forEach(x => this.appendChild(x)); return c }
    this.children.push(c)
    if (c) c.parentElement = this
    return c
  }
  removeChild(c) { this.children = this.children.filter(x => x !== c); return c }
  remove() { if (this._parent) this._parent.removeChild(this) }
  setAttribute(k, v) {
    this.attrs[k] = String(v)
    if (k === 'id') this.attrs.id = String(v)
    if (k === 'class') this.className = String(v)
  }
  getAttribute(k) { return this.attrs[k] }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn) }
  removeEventListener() {}
  dispatchEvent(ev) { (this._listeners[ev.type] || []).forEach(f => f(ev)); return true }
  click() { this.dispatchEvent({ type: 'click', target: this }) }
  querySelectorAll(sel) {
    const cls = sel.replace(/^\./, '').split(',').map(s => s.trim().replace(/^\./, ''))
    const out = []
    const walk = n => n.children.forEach(c => { if (cls.every(c2 => c.classList.contains(c2))) out.push(c); walk(c) })
    walk(this)
    return out
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null }
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 } }
  scrollTo() {}
  focus() {}
  setSelectionRange() {}
  contains() { return false }
  closest() { return null }
}

const byId = new Map()
function getEl(id) {
  if (!byId.has(id)) {
    const e = new El('div')
    e.id = id
    byId.set(id, e)
  }
  return byId.get(id)
}

const document = {
  getElementById: getEl,
  createElement: t => new El(t),
  createElementNS: (ns, t) => new El(t),
  createDocumentFragment: () => { const f = new El('fragment'); f.__frag = true; return f },
  createTextNode: t => { const e = new El('textnode'); e.textContent = t; return e },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  body: new El('body'),
  documentElement: new El('html')
}

global.document = document
global.window = global
global.addEventListener = () => {}
global.removeEventListener = () => {}
global.requestAnimationFrame = fn => setTimeout(fn, 0)
global.localStorage = { getItem: () => '', setItem: () => {} }
try {
  Object.defineProperty(global, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true, writable: true })
} catch (_) {}

// ------------------------------------------------------------
// 假 fetch：按页面会发的请求返回固定数据
// ------------------------------------------------------------
const RESULT = {
  formulas: [{ name: 'mahuang_tang', title: '麻黄汤' }],
  explanation: '这次辨证认为符合太阳伤寒：恶寒、无汗、身痛、脉紧并见。病机为风寒束表、卫闭营郁，故当发汗解表。服药后取微汗，不可大汗淋漓。',
  contraindications: ['表实无汗者主之，汗出者忌', '桂枝汤证（表虚有汗）禁'],
  state: [{ yes: true, title: '恶寒' }, { yes: true, title: '无汗' }]
}

const calls = []
global.fetch = async (url, opts) => {
  const p = String(url).replace(/^.*\/api\//, '')
  const body = opts && opts.body ? JSON.parse(opts.body) : null
  calls.push({ path: p, body })
  let data
  if (p === 'new') {
    data = {
      id: 'sess1', hasLLM: true,
      intro: '你好！我是中医辨证助手。请描述病人的症状（口语即可）。',
      question: { leaf: 'cold_aversion', title: '恶寒', phrase: '是不是怕冷、想盖被子？', candidates: 113 }
    }
  } else if (p === 'input' && body && body.text === '3') {
    // 「不清楚」→ 换一个问题
    data = {
      view: { question: { leaf: 'no_sweat', title: '无汗', phrase: '是不是完全没有汗？', candidates: 44 } },
      state: [{ yes: true, title: '恶寒' }, { yes: false, title: '白虎汤' }]
    }
  } else if (p === 'input' && body && body.text === '1') {
    // 「是」→ 直接给结论（模拟收敛）
    data = { view: { finished: true }, state: RESULT.state, result: RESULT }
  } else if (p === 'input') {
    data = {
      view: { question: { leaf: 'no_sweat', title: '无汗', phrase: '是不是完全没有汗？', candidates: 44 } },
      state: [{ yes: true, title: '恶寒' }]
    }
  } else if (p === 'chat') {
    // 故意给一段「带 Markdown」的回答，验证前端的兜底清洗 + 轻排版
    data = {
      reply: '### 煎药方法\n\n**麻黄汤**一般是先泡半小时，再小火煎两次。\n\n- 先泡三十分钟，水位没过药材两指\n- 头煎二十分钟，二煎十五分钟，两次混匀后分两次温服\n\n**需要注意**\n不要自行加量，附子类药必须先煎。\n\n### 饮食配合\n\n1. 偏清透的：绿豆、冬瓜\n2. 偏补气的：山药、小米\n\n想细问煎法里的哪一步，直接问我。'
    }
  } else if (p.startsWith('restart')) {
    data = { question: { leaf: 'cold_aversion', title: '恶寒', phrase: '是不是怕冷、想盖被子？', candidates: 113 } }
  } else {
    data = { error: '未预期的接口: ' + p }
  }
  return { ok: true, status: 200, text: async () => JSON.stringify(data), json: async () => data }
}

// ------------------------------------------------------------
// 执行页面脚本
// ------------------------------------------------------------
const html = fs.readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8')
const m = /<script>([\s\S]*?)<\/script>/.exec(html)
if (!m) { console.error('没找到页面脚本'); process.exit(1) }
const pageJs = m[1]

// 预先建好页面里用到的元素
;['scroller', 'thread', 'field', 'send', 'cand-pill', 'cand-text', 'llm-pill', 'llm-text', 'mode-tip'].forEach(getEl)
global.TextEncoder = global.TextEncoder || class { encode(s) { return Buffer.from(s) } }

const fn = new Function(pageJs + '\n; return { showResult, showQuestion, renderState, sendText, api, startNew }')
let scope
try {
  scope = fn()
} catch (e) {
  console.error('页面脚本执行失败：' + e.message)
  process.exit(1)
}

const thread = getEl('thread')
// 用户「实际能看到」的文本：把 textContent 与 innerHTML（去标签）都算进来。
// 仿真器不解析 innerHTML 成子节点，所以必须这样合并，否则会误报。
const plainText = () => {
  const out = []
  const walk = n => {
    if (n._text) out.push(n._text)
    if (n._html) out.push(String(n._html).replace(/<[^>]*>/g, ' '))
    n.children.forEach(walk)
  }
  thread.children.forEach(walk)
  return out.join('\n')
}
const allText = plainText
// 收集某类元素的 innerHTML（用于断言「选项文案 / 顺序」这类由 innerHTML 构造的内容）
const clsHtmlList = cls => {
  const out = []
  const walk = x => x.children.forEach(c => { if (c.classList.contains(cls)) out.push(String(c._html || '')); walk(c) })
  walk(thread)
  return out
}
const countCls = cls => clsHtmlList(cls).length

// ------------------------------------------------------------
;(async () => {
  console.log('=== 客户界面渲染测试（执行真实页面脚本）===\n')
  await new Promise(r => setTimeout(r, 80))

  console.log('[1] 初始化（GET /api/new）')
  ok('调用了 /api/new', calls.some(c => c.path === 'new'))
  ok('显示 intro 欢迎语', /中医辨证助手|请描述/.test(allText()), allText().slice(0, 60))
  ok('顶栏 LLM 状态更新为「AI 解释已开启」', getEl('llm-text').textContent.includes('AI'),
    getEl('llm-text').textContent)
  ok('给了示例症状可点标签', countCls('example') >= 3, String(countCls('example')))

  console.log('\n[2] 提问卡片')
  ok('渲染出提问卡片 .qcard', countCls('qcard') === 1, String(countCls('qcard')))
  ok('问题正文用了 phrase', /是不是怕冷/.test(allText()))
  ok('显示候选方数量', /113 个候选方/.test(allText()))
  ok('顶栏候选方 pill 可见', getEl('cand-pill').hidden === false && /113/.test(getEl('cand-text').textContent),
    getEl('cand-text').textContent)
  ok('选项共 3 个', countCls('opt') === 3, String(countCls('opt')))
  ok('选项竖向容器 .opts 存在', countCls('opts') === 1)
  ok('三个选项按「是 / 否 / 不清楚」顺序排列（竖向）', (() => {
    const opts = clsHtmlList('opt')
    if (opts.length !== 3) return false
    const t0 = opts[0], t1 = opts[1], t2 = opts[2]
    return /是/.test(t0) && /确实有这个症状/.test(t0) &&
      /否/.test(t1) && /没有这个症状/.test(t1) &&
      /不清楚/.test(t2) && /说不好/.test(t2)
  })(), JSON.stringify(clsHtmlList('opt').map(s => s.replace(/<[^>]*>/g, '').trim())))
  ok('有撤回 / 重新开始工具', /撤回上一步/.test(allText()) && /重新开始/.test(allText()),
    clsHtmlList('tool').map(s => s.replace(/<[^>]*>/g, '').trim()).join(' | '))

  console.log('\n[3] 点「不清楚」→ 换一个问题，旧卡片置灰')
  const opt = (() => {
    let found = null
    const walk = x => x.children.forEach(c => { if (!found && c.classList.contains('opt') && /不清楚/.test(c._html || '')) found = c; walk(c) })
    walk(thread)
    return found
  })()
  ok('找到「不清楚」按钮', !!opt)
  if (opt) opt.click()
  await new Promise(r => setTimeout(r, 120))
  ok('发出了 input 请求 text=3', calls.some(c => c.path === 'input' && c.body && c.body.text === '3'))
  ok('新问题「无汗」出现', /完全没有汗/.test(allText()))
  ok('出现了 2 张提问卡片（旧卡片保留并置灰）', countCls('qcard') === 2, String(countCls('qcard')))
  ok('旧卡片带 answered 类（置灰）', countCls('answered') >= 1, String(countCls('answered')))
  ok('用户回答以气泡形式出现在右侧', (() => {
    let n = 0
    const walk = x => x.children.forEach(c => { if (c.classList.contains('user')) n++; walk(c) })
    walk(thread)
    return n >= 1
  })())

  console.log('\n[4] 点「是」→ 收敛出结论卡片')
  const yesOpt = (() => {
    let found = null
    const walk = x => x.children.forEach(c => {
      if (!found && c.classList.contains('opt') && /class="ic">✓/.test(c._html || '')) found = c
      walk(c)
    })
    walk(thread)
    return found
  })()
  ok('找到「是」按钮', !!yesOpt)
  if (yesOpt) yesOpt.click()
  await new Promise(r => setTimeout(r, 150))
  ok('渲染出结论卡片 .resultcard', countCls('resultcard') === 1, String(countCls('resultcard')))
  ok('结论里有方剂名「麻黄汤」', /麻黄汤/.test(allText()))
  ok('结论里有解释正文', /风寒束表/.test(allText()))
  ok('结论里有禁忌区（⚠ 禁忌与注意事项）', /禁忌与注意事项/.test(allText()))
  ok('有免责声明', /不能替代执业医师/.test(allText()))
  ok('结论后给了「继续提问」「重新开始」', /继续提问/.test(allText()) && /重新开始/.test(allText()))
  ok('提问卡片全部置灰（不再可点）', countCls('answered') >= 2, String(countCls('answered')))
  ok('顶栏候选 pill 已隐藏', getEl('cand-pill').hidden === true)

  console.log('\n[5] 辨证后追问（走 /api/chat）——顺带验证答案排版')
  await scope.sendText('这个方子怎么煎？')
  await new Promise(r => setTimeout(r, 120))
  ok('发出了 chat 请求', calls.some(c => c.path === 'chat'))
  ok('大模型回答显示为一条助手消息', /小火煎两次/.test(allText()))

  const clsEls = cls => {
    const out = []
    const walk = x => x.children.forEach(c => { if (c.classList.contains(cls)) out.push(c); walk(c) })
    walk(thread)
    return out
  }
  const replyText = allText()
  ok('回答里没有 ** 粗体记号', !replyText.includes('**'), (replyText.match(/\*\*[^\n]*/g) || []).join(' | '))
  ok('回答里没有 # 标题记号', !/^\s*#{1,6}\s/m.test(replyText), (replyText.match(/^\s*#.*$/gm) || []).join(' | '))
  ok('Markdown 的 - 列表已转成「·」', replyText.includes('· 先泡三十分钟'), '')
  ok('小标题排成 .a-h 块（带左侧竖条）', clsEls('a-h').length >= 2,
    '得到 ' + clsEls('a-h').length + ' 个：' + clsEls('a-h').map(e => '[' + e.textContent + ']').join('') +
    ' ┃ 段落：' + clsEls('a-p').map(e => '[' + String(e.textContent).slice(0, 14) + ']').join(''))
  ok('列表项排成 .a-li', clsEls('a-li').length >= 3, '得到 ' + clsEls('a-li').length + ' 个')
  ok('编号项用 .a-li-n（悬挂缩进更宽）', clsEls('a-li-n').length >= 2, '得到 ' + clsEls('a-li-n').length + ' 个')
  ok('普通段落排成 .a-p', clsEls('a-p').length >= 1, '得到 ' + clsEls('a-p').length + ' 个')
  ok('回答容器带 .bubble-answer（white-space:normal）', clsEls('bubble-answer').length === 1)
  ok('结尾的引导语仍在', /想细问煎法/.test(replyText))

  console.log('\n[6] 状态折叠块')
  let statebox = null
  const walkState = x => x.children.forEach(c => { if (!statebox && c.classList.contains('statebox')) statebox = c; walkState(c) })
  walkState(thread)
  ok('渲染出可折叠状态块 .statebox', !!statebox)
  ok('摘要显示已确认/已排除数量', /已确认/.test(allText()) && /已排除/.test(allText()))
  ok('状态里有 chip', countCls('chip') >= 1, String(countCls('chip')))

  console.log('\n============================================')
  console.log('渲染测试：' + pass + ' 通过, ' + fail + ' 失败')
  if (fail) {
    console.log('\n失败明细：')
    failures.forEach(f => console.log('  ✗ ' + f))
    process.exitCode = 1
  } else {
    console.log('全部通过 ✓ —— 对话流、竖排选项、结论卡片、状态折叠都能正确渲染')
  }
})().catch(e => {
  console.error('测试异常：' + e.message + '\n' + String(e.stack || '').split('\n').slice(1, 4).join('\n'))
  process.exitCode = 1
})
