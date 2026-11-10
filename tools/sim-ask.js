'use strict'
// tools/sim-ask.js —— 模拟问诊，打印反问顺序
//
// 用法：
//   node tools/sim-ask.js "拉肚子"            默认每个问题都答「是」
//   node tools/sim-ask.js "拉肚子" --no       每个问题都答「否」
//   node tools/sim-ask.js "拉肚子" --mix      交替答（模拟真实情况）
//   node tools/sim-ask.js "拉肚子" --max 15   最多问几个
//
// 目的：验证「症状筛选组」是否被真正用上（先问部位/大类，再问具体症状），
// 以及同一个大类会不会被反复问很多次。
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))

const args = process.argv.slice(2)
const text = args.find(a => !a.startsWith('--')) || ''
const MODE = args.includes('--no') ? 'all-no'
  : (args.includes('--smart') ? 'smart'
    : (args.includes('--mix') ? 'mix' : 'all-yes'))
const maxIdx = args.indexOf('--max')
const MAX = maxIdx >= 0 ? parseInt(args[maxIdx + 1], 10) || 12 : 12

const { registry } = loadAll(path.join(ROOT, 'plugins'))
const e = new Engine(registry)
const asker = new Asker(e)

if (text) {
  e.feed(text)
  console.log('输入：' + text)
}
console.log('模式：' + MODE +
  (MODE === 'smart' ? '（诚实病人：自己有这个症状才答是）' : '') + '\n')

// 诚实病人：先用一个临时引擎算出「病人身上到底有哪些症状」
let TRUTH = null
if (MODE === 'smart') {
  const probe = new Engine(registry)
  probe.feed(text)
  TRUTH = new Set(Object.keys(probe.state).filter(k => probe.state[k] === 'yes'))
  console.log('病人实际有的症状 ' + TRUTH.size + ' 个：' + [...TRUTH].slice(0, 12).join('、') +
    (TRUTH.size > 12 ? ' …' : '') + '\n')
}

const GROUP_HINTS = {}
for (const [n, d] of Object.entries(registry)) {
  if (d.kind !== 'symptom_group') continue
  GROUP_HINTS[n] = Array.isArray(d.children) ? d.children.length : 0
}

const log = []
let prevCands = asker.candidates().length
console.log('起始候选方：' + prevCands + ' 个')

for (let i = 0; i < MAX; i++) {
  const cands = asker.candidates().length
  if (cands <= 1) { console.log('\n（候选只剩 ' + cands + ' 个，收敛）'); break }
  const q = asker.nextQuestion()
  if (!q) { console.log('\n（没有可问的了，候选 ' + cands + ' 个，多解）'); break }

  const tag = q.isGroup ? '【筛选·' + q.covers.length + '个子】' : '';
  console.log('\nQ' + (i + 1) + ' ' + tag + q.title + '（覆盖候选 ' + q.count + '/' + cands + '）')
  console.log('   ' + q.phrase)

  // 决定答案
  let ans = 'yes'
  if (MODE === 'all-no') ans = 'no'
  else if (MODE === 'mix') ans = (i % 2 === 0) ? 'yes' : 'no'
  else if (MODE === 'smart') {
    if (q.isGroup) {
      // 组：这个组下面只要有一个症状病人真的有 → 答是
      const kids = registry[q.leaf] && registry[q.leaf].children ? registry[q.leaf].children : []
      ans = kids.some(k => TRUTH.has(k)) ? 'yes' : 'no'
    } else {
      ans = TRUTH.has(q.leaf) ? 'yes' : 'no'
    }
  }

  e.setDirect(q.leaf, ans)
  if (q.isGroup) {
    asker.groupAskedCount += 1
    if (ans === 'yes') asker.focusGroup(q.leaf)
  }
  // 和 core/session.js 保持一致：系统闸门答「有」要记下来（会追问几个关键子症状，
  // 并按 data/symptom-systems.js 的 rep 直接点亮代表症状）
  if (q.isSystem && ans === 'yes') asker.markGateYes(q.leaf)
  if (ans === 'no') asker.markAsked(q.leaf)
  log.push({ q: q.title, group: !!q.isGroup, ans })

  const after = asker.candidates().length
  console.log('   → 答「' + ans + '」，候选方 ' + cands + ' → ' + after)
}

console.log('\n=== 本次问了 ' + log.length + ' 个问题 ===')
const g = log.filter(x => x.group).length
console.log('其中筛选组（部位/大类）' + g + ' 个，具体症状 ' + (log.length - g) + ' 个')

// 同一大类的重复提问检查
const seen = {}
for (const x of log) {
  for (const [n, d] of Object.entries(registry)) {
    if (d.kind !== 'symptom_group' || !Array.isArray(d.children)) continue
    if (d.children.includes(x.q) || x.q === registry[n].title) {
      seen[n] = (seen[n] || 0) + 1
    }
  }
}
const repeats = Object.entries(seen).filter(([, v]) => v > 1)
if (repeats.length) {
  console.log('\n⚠ 同一大类被问了多次：')
  for (const [n, v] of repeats) {
    console.log('  ' + n + '「' + registry[n].title + '」' + v + ' 次')
  }
} else {
  console.log('\n✓ 没有同一大类被反复问的情况')
}
