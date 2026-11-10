'use strict'
// tools/check-symptom-groups.js —— 症状筛选组的规矩体检
//
// 把「上位症状层」的设计规矩固化成可执行检查：
//   1. 每个组必须有 children，且 children 全是 kind:'symptom'（组不能嵌套组）
//   2. children 不能重复、不能引用不存在的节点
//   3. **组不能被写进任何 needs 路径**（组只做粗筛，不参与推理）
//   4. 组的 trigger 不能含内容物词/易混词黑名单
//   5. 组的 trigger 不能含「只表示感觉不表示动作」的易混词（想吐/欲呕 → 属恶心）
//   6. 规则正确性抽检（下面 CASES）：三种关键场景必须符合预期
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const FORBIDDEN_IN_TRIGGER = [
  '吐血', '咯血', '咳血', '吐涎沫', '吐蛔', '吐脓', '吐痰',
  '便血', '尿血', '崩漏', '黑便', '想吐', '欲吐', '吐出来'
]

const errors = []
const warns = []

const groups = Object.entries(registry).filter(([, d]) => d.kind === 'symptom_group')
const childOf = new Map()

for (const [id, d] of groups) {
  if (!Array.isArray(d.children) || !d.children.length) {
    errors.push(id + ' 没有 children')
    continue
  }
  const dup = d.children.filter((c, i) => d.children.indexOf(c) !== i)
  if (dup.length) errors.push(id + ' children 重复: ' + [...new Set(dup)].join(','))

  for (const c of d.children) {
    const cd = registry[c]
    if (!cd) { errors.push(id + ' 引用不存在的节点 ' + c); continue }
    if (cd.kind !== 'symptom') errors.push(id + ' 的子 ' + c + ' 不是 symptom（kind=' + cd.kind + '）')
    if (!childOf.has(c)) childOf.set(c, [])
    childOf.get(c).push(id)
  }

  const kws = []
  if (typeof d.trigger === 'function') {
    const m = /\[([\s\S]*?)\]/.exec(d.trigger.toString())
    if (m) for (const q of m[1].matchAll(/'([^']*)'|"([^"]*)"/g)) kws.push(q[1] || q[2])
  }
  if (!kws.length) {
    // 系统闸门（kind:'symptom_group' + isSystem）故意没有 trigger：
    // 它是靠问诊回答「这个系统有没有问题」来定，不靠病人文字触发。
    if (!d.isSystem) errors.push(id + ' 没有 trigger（至少放一个大类词，否则只能靠子症状汇入）')
  }
  for (const kw of kws) {
    for (const bad of FORBIDDEN_IN_TRIGGER) {
      if (kw.includes(bad)) errors.push(id + ' 的 trigger「' + kw + '」含禁止词「' + bad + '」')
    }
  }
}

// 规矩 3：组不能被 needs 引用
const groupNames = new Set(groups.map(([id]) => id))
for (const [id, d] of Object.entries(registry)) {
  if (!d.needs) continue
  const paths = Array.isArray(d.needs[0]) ? d.needs : [d.needs]
  for (const p of paths) for (const c of (p || [])) {
    const dep = String(c).split('.')[0]
    if (groupNames.has(dep)) errors.push(id + ' 在 needs 里引用了症状组 ' + dep + '（组只做粗筛，不参与推理）')
  }
}

// 覆盖情况
const symptoms = Object.entries(registry).filter(([, d]) => d.kind === 'symptom')
const orphans = symptoms.filter(([id]) => !childOf.has(id))
for (const [id, d] of orphans) warns.push('症状未归族: ' + id + ' | ' + d.title)

console.log('=== 症状筛选组体检 ===')
console.log('组数: ' + groups.length + '｜症状数: ' + symptoms.length +
  '｜已归族: ' + (symptoms.length - orphans.length) + '｜未归族: ' + orphans.length)
const multi = [...childOf.entries()].filter(([, v]) => v.length > 1)
console.log('多归属症状: ' + multi.length + ' 个（同一症状挂在多个维度下）')

console.log('\n=== 规则错误（' + errors.length + '）===')
if (!errors.length) console.log('  无 ✓')
for (const e of errors) console.log('  ✗ ' + e)

if (warns.length) {
  console.log('\n=== 提示（' + warns.length + '）===')
  for (const w of warns.slice(0, 40)) console.log('  · ' + w)
  if (warns.length > 40) console.log('  …… 还有 ' + (warns.length - 40) + ' 条')
}

// 规则 6：行为抽检
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const CASES = [
  // 干呕 = 有呕吐动作 → 呕吐族成立；但干呕不是「恶心（只有感觉）」
  { text: '干呕吐涎沫', yes: ['vomit_any', 'vomit_saliva'], notYes: ['nausea'] },
  // 恶心但没吐 → 只有 nausea；呕吐族**不得**成立（组永不被判 no，所以查 notYes）
  { text: '恶心想吐但没吐', yes: ['nausea'], notYes: ['vomit_any', 'vomiting'] },
  // 咯血 ≠ 吐血 → 只归出血族
  { text: '咳嗽咳出血来', yes: ['hemoptysis', 'bleeding_any'], notYes: ['vomit_any'] },
  // 咳痰不是呕吐
  { text: '把痰吐出来', notYes: ['vomit_any'] },
  // 只否定子类，不得把组判 no
  { text: '不吐血', no: ['hematemesis'], notNo: ['vomit_any'] },
  { text: '没有出冷汗', no: ['cold_sweat'], notNo: ['sweat_any'] },
  { text: '大便带血', yes: ['stool_blood', 'bleeding_any', 'stool_any'] },
  { text: '肚子痛，拉肚子', yes: ['abdominal_pain', 'diarrhea', 'pain_any', 'diarrhea_any'] },
  { text: '脸上红斑，咽喉痛，咳出脓血', yes: ['yang_du'] }
]

console.log('\n=== 行为抽检 ===')
let pass = 0, fail = 0
for (const c of CASES) {
  const e = new Engine(registry)
  e.feed(c.text)
  const problems = []
  for (const n of c.yes || []) if (e.state[n] !== 'yes') problems.push(n + ' 应为 yes，实为 ' + e.state[n])
  for (const n of c.no || []) if (e.state[n] !== 'no') problems.push(n + ' 应为 no，实为 ' + e.state[n])
  for (const n of c.notYes || []) if (e.state[n] === 'yes') problems.push(n + ' 不应为 yes')
  for (const n of c.notNo || []) if (e.state[n] === 'no') problems.push(n + ' 不应被判 no')
  if (problems.length) {
    fail++
    console.log('  ✗ 「' + c.text + '」 → ' + problems.join('；'))
  } else {
    pass++
    console.log('  ✓ 「' + c.text + '」')
  }
}

console.log('\n体检结论: ' + (errors.length === 0 && fail === 0 ? '全部通过 ✓' : '存在问题 ✗') +
  '（规则错误 ' + errors.length + '，抽检失败 ' + fail + '/' + CASES.length + '）')
process.exit(errors.length === 0 && fail === 0 ? 0 : 1)
