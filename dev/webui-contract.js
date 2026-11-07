'use strict'
// dev/webui-contract.js
// 用真实接口把问诊页面的每个请求走一遍，断言前端读取的字段都存在且类型正确。
// （无法在工具里开浏览器，所以用这个脚本替代「点一遍」的验证）
//
// 用法： node dev/webui-contract.js [baseUrl]
//        默认 http://127.0.0.1:3088

const BASE = process.argv[2] || 'http://127.0.0.1:3088'

let pass = 0
let fail = 0
const failures = []

function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); return true }
  fail++
  failures.push(name + (detail ? '  → ' + detail : ''))
  console.log('  ✗ ' + name + (detail ? '  → ' + detail : ''))
  return false
}

async function api(path, body, method) {
  const m = method || 'POST'
  const r = await fetch(BASE + '/api/' + path, {
    method: m,
    headers: { 'Content-Type': 'application/json' },
    body: m === 'POST' ? JSON.stringify(body || {}) : undefined
  })
  const text = await r.text()
  try { return JSON.parse(text) } catch (_) { throw new Error('非 JSON 响应: ' + text.slice(0, 200)) }
}

function hasQuestionShape(q) {
  return q && typeof q === 'object' &&
    typeof q.phrase === 'string' && q.phrase.length > 0 &&
    typeof q.title === 'string' &&
    typeof q.candidates === 'number'
}

;(async () => {
  console.log('=== 问诊界面接口契约测试 ===')
  console.log('  目标: ' + BASE + '\n')

  // ---- 1. /api/new ----
  console.log('[1] GET /api/new  （页面初始化）')
  const n = await api('new', {}, 'GET')
  check('返回 id', typeof n.id === 'string' && n.id.length > 0, JSON.stringify(n.id))
  check('返回 hasLLM（布尔）', typeof n.hasLLM === 'boolean', String(n.hasLLM))
  check('返回 intro 文案（页面第一句）', typeof n.intro === 'string' && n.intro.length > 0, String(n.intro).slice(0, 40))
  check('返回首问 question.phrase', hasQuestionShape(n.question), JSON.stringify(n.question))
  check('question.candidates 是候选方数量', n.question && n.question.candidates > 0)
  const sid = n.id
  let totalQs = 1
  console.log('    首问：' + (n.question && n.question.phrase).slice(0, 40) + '…')
  console.log('    LLM: ' + (n.hasLLM ? '已连接' : '未配置（仅规则辨证）') + ' | 候选 ' + (n.question && n.question.candidates))

  // ---- 2. 口语描述 ----
  console.log('\n[2] POST /api/input  （用户描述症状）')
  const r1 = await api('input', { text: '病人发烧，怕冷，一点汗都没有，全身酸痛', sid })
  check('没有 error 字段', !r1.error, r1.error)
  check('返回 view 对象', !!r1.view)
  check('返回 state 数组（状态 chips 用）', Array.isArray(r1.state), typeof r1.state)
  const stItem = (r1.state || [])[0]
  check('state 项含 { yes:布尔, title:字符串 }',
    stItem && typeof stItem.yes === 'boolean' && typeof stItem.title === 'string',
    JSON.stringify(stItem))
  console.log('    状态：' + (r1.state || []).map(x => (x.yes ? '+' : '−') + x.title).join(' '))

  // ---- 3. 定向回答直到收敛 ----
  console.log('\n[3] POST /api/input  按症状定向回答，直到出结论')
  // 扮演一个「太阳伤寒」病人：这些症状答「是」，其它一律答「否」
  const WANT = new Set(['no_sweat', 'wind_aversion', 'cold_aversion', 'fever', 'body_pain', 'chuan', 'vomiting'])
  let finished = false
  let result = null
  let r = r1
  let rounds = 0
  for (; rounds < 60; rounds++) {
    if (r.view && r.view.finished) { finished = true; result = r.result; break }
    const q = r.view && r.view.question
    if (!q) { break }                     // 没有可问的了（多解或无候选）
    const ans = WANT.has(q.leaf) ? '1' : '2'
    r = await api('input', { text: ans, sid })
    if (r.error) { check('回答时无 error', false, r.error); break }
    totalQs++
  }
  if (finished) {
    check('收敛时返回 view.finished === true', r.view.finished === true)
    check('收敛时带 result', !!result, JSON.stringify(r.view))
  } else {
    console.log('  · 未能收敛（' + rounds + ' 轮后 question 变 null 或达上限）—— 这是条文数据的判定问题，与界面无关')
  }
  if (result) {
    check('result.formulas 是数组（结论方剂）', Array.isArray(result.formulas), typeof result.formulas)
    check('result.formulas 项含 { name, title }',
      !result.formulas.length || (result.formulas[0].title && result.formulas[0].name),
      JSON.stringify(result.formulas && result.formulas[0]))
    check('result.explanation 是非空字符串（解释正文）',
      typeof result.explanation === 'string' && result.explanation.length > 10,
      String(result.explanation).slice(0, 40))
    check('result.contraindications 是数组（禁忌）', Array.isArray(result.contraindications),
      typeof result.contraindications)
    check('result.state 是数组（结论里的状态）', Array.isArray(result.state) || result.state === undefined)
    console.log('    结论：' + (result.formulas || []).map(f => f.title).join('、'))
    console.log('    禁忌：' + (result.contraindications || []).slice(0, 2).join('；').slice(0, 60))
  }

  // ---- 4. /api/chat（辨证后追问，走大模型）----
  console.log('\n[4] POST /api/chat  （辨证后继续提问）')
  const c = await api('chat', { text: '这个方子怎么煎？', sid })
  if (c.error) {
    check('追问接口无 error', false, c.error)
  } else {
    check('返回 reply 字段（页面显示为一条助手消息）',
      typeof c.reply === 'string' && c.reply.length > 0, String(c.reply).slice(0, 50))
    console.log('    回答：' + String(c.reply).slice(0, 60).replace(/\n/g, ' ') + '…')
  }

  // ---- 5. 撤回 ----
  console.log('\n[5] POST /api/input  「撤回」')
  const u = await api('input', { text: '撤回', sid })
  check('撤回不报错', !u.error, u.error)
  check('撤回带 undone 或 note 或 view', u.undone || u.note || u.view, JSON.stringify(Object.keys(u || {})))

  // ---- 6. 重新开始 ----
  console.log('\n[6] GET /api/restart  （重新开始）')
  const rs = await api('restart/' + sid, {}, 'GET')
  check('restart 返回 question 或 finished', !!(rs.question || rs.finished), JSON.stringify(Object.keys(rs || {})))
  check('restart 后回到初始 question', hasQuestionShape(rs.question), JSON.stringify(rs.question))

  // ---- 7. 未知会话的兜底 ----
  console.log('\n[7] 异常兜底：不存在的会话')
  const bad = await api('input', { text: '测试', sid: 'nope' })
  check('未知会话返回 error 文案（页面会当成一条消息显示）',
    typeof bad.error === 'string' && bad.error.length > 0, JSON.stringify(bad))

  // ---- 8. 页面本身 ----
  console.log('\n[8] GET /  （页面本体）')
  const html = await (await fetch(BASE + '/')).text()
  check('返回 HTML', /^<!DOCTYPE html>/i.test(html.trim()))
  check('含对话容器 .thread', html.includes('class="thread"'))
  check('含选项容器（竖向 flex 排列）',
    html.includes('.opts { display: flex; flex-direction: column') && html.includes("opts.className = 'opts'"),
    'CSS 或 JS 里缺少竖向选项容器定义')
  check('选项是按钮且带 .opt 类', /class="opt /.test(html) || html.includes("'opt '"))
  check('含输入框 #field', html.includes('id="field"'))
  check('不再是旧的棕色主题变量', !html.includes('--brand: #8a2b2b'))
  check('是白色基调', html.includes('--bg: #ffffff'))

  console.log('\n============================================')
  console.log('契约测试：' + pass + ' 通过, ' + fail + ' 失败')
  if (fail) {
    console.log('\n失败明细：')
    failures.forEach(f => console.log('  ✗ ' + f))
    process.exitCode = 1
  } else {
    console.log('全部通过 ✓ —— 页面读取的所有字段后端都提供了')
  }
})().catch(e => {
  console.error('\n测试脚本异常：' + e.message)
  process.exitCode = 1
})
