'use strict'
// tools/check-symptom-relations.js —— 症状「关系约束」体检
//
// 把用户提的四条规矩固化成可执行检查（data/symptom-relations.js）：
//   1. 有汗「是」⇒ 无汗必然「否」（同一个问题不用问两遍）
//   2. 便秘「是」⇒ 下利必然「否」（两者相反）
//   3. 便血「否」⇒ 便脓血 / 近血 / 远血 一律「否」（轻度没有，重度一定没有）
//   4. 反问顺序：先问上位（有没有便秘），再问下位（是不是轻度便秘）
//
// 前三条靠 engine.applyRelations()，第四条靠 engine/asker.js 的 promoteToParent()。
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))
const { MUTEX, SPECIALIZE } = require(path.join(ROOT, 'data', 'symptom-relations'))

const { registry } = loadAll(path.join(ROOT, 'plugins'))

const errors = []
const warnings = []

// ---------------- 一、静态校验 ----------------
const isSymptom = n => registry[n] && registry[n].kind === 'symptom'

for (const [a, b] of MUTEX) {
  if (!isSymptom(a)) errors.push('互斥对里的 ' + a + ' 不存在或不是症状')
  if (!isSymptom(b)) errors.push('互斥对里的 ' + b + ' 不存在或不是症状')
  if (a === b) errors.push('互斥对 ' + a + ' 自己和自己互斥')
}

const parentOf = {}
for (const parent of Object.keys(SPECIALIZE)) {
  if (!isSymptom(parent)) { errors.push('上位 ' + parent + ' 不存在或不是症状'); continue }
  for (const kid of SPECIALIZE[parent]) {
    if (!isSymptom(kid)) { errors.push(parent + ' 的下位 ' + kid + ' 不存在或不是症状'); continue }
    if (kid === parent) errors.push(parent + ' 把自己列为下位')
    if (parentOf[kid]) warnings.push(kid + ' 同时是 ' + parentOf[kid] + ' 和 ' + parent + ' 的下位（只认第一个）')
    parentOf[kid] = parent
  }
  if (SPECIALIZE[parent].length === 0) errors.push(parent + ' 的下列表是空的')
}

// 环检测：A 是 B 的下位、B 又是 A 的下位 → 会无限反转
for (const kid of Object.keys(parentOf)) {
  let cur = kid
  let hop = 0
  while (parentOf[cur] && hop++ < 20) {
    cur = parentOf[cur]
    if (cur === kid) { errors.push('上下位关系成环：' + kid); break }
  }
}

// 同一个症状不能既互斥又互为上下位（语义会打架）
for (const [a, b] of MUTEX) {
  if (parentOf[a] === b || parentOf[b] === a) {
    errors.push(a + ' 与 ' + b + ' 既是互斥又是上下位，语义冲突')
  }
}

console.log('=== 症状关系体检 ===')
console.log('互斥对 ' + MUTEX.length + ' 组｜上位→下位 ' +
  Object.keys(SPECIALIZE).length + ' 组（共 ' + Object.keys(parentOf).length + ' 个下位）')

// ---------------- 二、行为抽检 ----------------
const CASES = [
  {
    name: '有汗「是」⇒ 无汗「否」',
    set: [['sweat', 'yes']],
    yes: ['sweat'], no: ['no_sweat']
  },
  {
    name: '无汗「是」⇒ 有汗及自汗/盗汗/冷汗/漏汗/黄汗「否」',
    set: [['no_sweat', 'yes']],
    yes: ['no_sweat'],
    no: ['sweat', 'auto_sweat', 'night_sweat', 'cold_sweat', 'leak_sweat', 'yellow_sweat']
  },
  {
    // 「局部汗出」故意不做「出汗」的下位：病人可以说「我平时不出汗，就是手足老出汗」。
    // 这里把这条设计意图钉住，免得以后有人手贱又加回 SPECIALIZE。
    name: '无汗「是」不影响局部汗出（但头汗出/腰以上出汗/手足汗出）',
    set: [['no_sweat', 'yes']],
    unknown: ['head_sweat_only', 'waist_split_sweat', 'shouhan']
  },
  {
    name: '便秘「是」⇒ 下利及久利/清谷/鸭溏/气利「否」',
    set: [['constipation', 'yes']],
    yes: ['constipation'],
    no: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li']
  },
  {
    name: '下利「是」⇒ 便秘「否」',
    set: [['diarrhea', 'yes']],
    yes: ['diarrhea'], no: ['constipation']
  },
  {
    name: '便血「否」⇒ 便脓血/近血/远血 一律「否」',
    set: [['stool_blood', 'no']],
    no: ['blood_pus_stool', 'blood_after_stool', 'blood_before_stool']
  },
  {
    name: '便脓血「是」⇒ 大便带血「是」（下位成立则上位成立）',
    set: [['blood_pus_stool', 'yes']],
    yes: ['blood_pus_stool', 'stool_blood']
  },
  {
    name: '不吐血 ⇒ 不吐脓血',
    set: [['hematemesis', 'no']],
    no: ['tu_nongxue']
  },
  {
    name: '不咳嗽 ⇒ 不咯血/无喉中痰鸣',
    set: [['cough', 'no']],
    no: ['hemoptysis', 'throat_rales', 'qi_upward_cough']
  },
  {
    name: '不渴 ⇒ 无大渴',
    set: [['thirsty', 'no']],
    no: ['severe_thirst']
  },
  {
    name: '补问上位不会误伤：便秘「是」之后轻度便秘仍可为「是」',
    set: [['constipation', 'yes'], ['qingdubianmi', 'yes']],
    yes: ['constipation', 'qingdubianmi']
  }
]

// 自然语言喂入（真实病人说的话）
const FEED_CASES = [
  { text: '有点汗', yes: ['sweat'], no: ['no_sweat'] },
  { text: '一点汗都没有', yes: ['no_sweat'], no: ['sweat', 'auto_sweat'] },
  { text: '便秘', yes: ['constipation'], no: ['diarrhea'] },
  { text: '拉肚子', yes: ['diarrhea'], no: ['constipation'] },
  { text: '没有便血', no: ['stool_blood', 'blood_pus_stool', 'blood_after_stool'] }
]

let pass = 0
let fail = 0
const report = (ok, msg) => {
  if (ok) { pass++ } else { fail++; errors.push(msg) }
}

console.log('\n=== 行为抽检 ===')
for (const c of CASES) {
  const e = new Engine(registry)
  for (const [n, v] of c.set) e.setDirect(n, v)
  const bad = []
  for (const n of c.yes || []) if (e.state[n] !== 'yes') bad.push(n + ' 应为 yes，实为 ' + e.state[n])
  for (const n of c.no || []) if (e.state[n] !== 'no') bad.push(n + ' 应为 no，实为 ' + e.state[n])
  for (const n of c.unknown || []) if (e.state[n] !== 'unknown') bad.push(n + ' 应保持 unknown，实为 ' + e.state[n])
  report(!bad.length, '「' + c.name + '」→ ' + bad.join('；'))
  console.log((bad.length ? '  ✗ ' : '  ✓ ') + c.name + (bad.length ? ' → ' + bad.join('；') : ''))
}

console.log('\n=== 自然语言喂入 ===')
for (const c of FEED_CASES) {
  const e = new Engine(registry)
  e.feed(c.text)
  const bad = []
  for (const n of c.yes || []) if (e.state[n] !== 'yes') bad.push(n + ' 应为 yes，实为 ' + e.state[n])
  for (const n of c.no || []) if (e.state[n] !== 'no') bad.push(n + ' 应为 no，实为 ' + e.state[n])
  report(!bad.length, '喂「' + c.text + '」→ ' + bad.join('；'))
  console.log((bad.length ? '  ✗ ' : '  ✓ ') + '「' + c.text + '」' + (bad.length ? ' → ' + bad.join('；') : ''))
}

// ---------------- 三、问诊顺序：先上位、后下位 ----------------
console.log('\n=== 问诊顺序（先上位、后下位）===')
{
  const e = new Engine(registry)
  const asker = new Asker(e)
  const got = asker.promoteToParent('qingdubianmi')
  report(got === 'constipation', '「轻度便秘」应先把上位「便秘」问出来，实为 ' + got)
  console.log((got === 'constipation' ? '  ✓ ' : '  ✗ ') + '「轻度便秘」→ 先问「' +
    (got ? registry[got].title : '（无）') + '」')

  e.setDirect('constipation', 'yes')
  const got2 = asker.promoteToParent('qingdubianmi')
  report(got2 === null, '已经确认便秘之后，就该直接问轻度便秘，不能再回头问上位，实为 ' + got2)
  console.log((got2 === null ? '  ✓ ' : '  ✗ ') + '便秘已确认 → 直接问「轻度便秘」')

  const got3 = asker.promoteToParent('sweat')
  report(got3 === null, '「汗出」没有上位，不应被顶替，实为 ' + got3)
  console.log((got3 === null ? '  ✓ ' : '  ✗ ') + '「汗出」没有上位 → 照常问')
}

// ---------------- 四、闸门答「有」后不再问同义症状 ----------------
console.log('\n=== 闸门答「有」后不再问同义症状 ===')
{
  const e = new Engine(registry)
  const asker = new Asker(e)
  e.feed('发烧')
  // 模拟 session.js：系统闸门答「有」
  e.setDirect('sys_sweat', 'yes')
  asker.focusGroup('sys_sweat')
  asker.markGateYes('sys_sweat')
  asker.groupAskedCount += 1

  report(e.state['sweat'] === 'yes', '闸门答「有」应直接点亮「汗出」，实为 ' + e.state['sweat'])
  report(e.state['no_sweat'] === 'no', '闸门答「有」应自动把「无汗」判否，实为 ' + e.state['no_sweat'])

  // 之后不许再把「汗出」「无汗」当成问题问出来
  const askedTitles = []
  for (let i = 0; i < 12; i++) {
    const q = asker.nextQuestion()
    if (!q) break
    if (askedTitles.includes(q.leaf)) break
    askedTitles.push(q.leaf)
    e.setDirect(q.leaf, 'no')
    asker.markAsked(q.leaf)
  }
  const dup = ['sweat', 'no_sweat'].filter(n => askedTitles.includes(n))
  report(dup.length === 0, '出汗答「有」之后又问了同义症状：' + dup.join('、'))
  console.log((dup.length ? '  ✗ ' : '  ✓ ') +
    '出汗之后问了 ' + askedTitles.length + ' 个问题，没有重复问「汗出/无汗」' +
    (dup.length ? '（重复：' + dup.join('、') + '）' : ''))
}

// ---------------- 结论 ----------------
if (warnings.length) {
  console.log('\n=== 提示（' + warnings.length + '）===')
  for (const w of warnings) console.log('  · ' + w)
}
if (errors.length) {
  console.log('\n=== 问题（' + errors.length + '）===')
  for (const x of errors) console.log('  ✗ ' + x)
} else {
  console.log('\n=== 问题（0）===\n  无 ✓')
}
console.log('\n体检结论: ' + (errors.length === 0 ? '全部通过 ✓' : '存在问题 ✗') +
  '（通过 ' + pass + '，失败 ' + fail + '）')
process.exit(errors.length === 0 ? 0 : 1)
