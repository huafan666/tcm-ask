'use strict'
// tools/apply-symptom-groups.js —— 生成症状筛选组（上位节点）
//
// 用法：
//   node tools/apply-symptom-groups.js           预览 + 校验
//   node tools/apply-symptom-groups.js --write   落库
//
// 校验项：
//   · 每个 children 成员必须存在且 kind === 'symptom'（组不能嵌套组）
//   · children 不能重复、不能为空
//   · 组自己的 trigger 不能含「内容物词/易混词」黑名单
//   · 组名不能和已有节点重名
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const GROUPS_FILE = path.join(ROOT, 'data', 'symptom-groups.js')
const WRITE = process.argv.includes('--write')

// 组的 trigger 里禁止出现的词：这些是内容物或易混词，必须在具体症状里答
const FORBIDDEN_IN_TRIGGER = [
  '吐血', '咯血', '咳血', '吐涎沫', '吐蛔', '吐脓', '吐痰',
  '便血', '尿血', '崩漏', '黑便',
  '咯', '痰', '吞咽'
]

const { GROUPS } = require(GROUPS_FILE)
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
const warnings = []
const seenChildren = new Map()

for (const g of GROUPS) {
  if (!g.name || !g.title) errors.push('组缺 name/title: ' + JSON.stringify(g).slice(0, 60))
  if (registry[g.name] && registry[g.name].kind !== 'symptom_group') {
    errors.push(g.name + ' 与已有节点重名（现有 kind=' + registry[g.name].kind + '）')
  }
  if (!Array.isArray(g.children) || g.children.length === 0) {
    errors.push(g.name + ' 没有任何 children')
    continue
  }
  const dup = g.children.filter((c, i) => g.children.indexOf(c) !== i)
  if (dup.length) errors.push(g.name + ' 的 children 有重复: ' + [...new Set(dup)].join(', '))

  for (const c of g.children) {
    const def = registry[c]
    if (!def) { errors.push(g.name + ' 引用了不存在的症状 ' + c); continue }
    if (def.kind !== 'symptom') {
      errors.push(g.name + ' 的子 ' + c + ' 不是 symptom（kind=' + def.kind + '）')
    }
    if (!seenChildren.has(c)) seenChildren.set(c, [])
    seenChildren.get(c).push(g.name)
  }

  for (const kw of g.trigger || []) {
    for (const bad of FORBIDDEN_IN_TRIGGER) {
      if (kw.includes(bad)) {
        errors.push(g.name + ' 的 trigger「' + kw + '」含禁止词「' + bad + '」（内容物/易混词不能进组的词表）')
      }
    }
  }
}

// 覆盖率：哪些症状没有归到任何组（提示，不算错误）
const orphans = []
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'symptom') continue
  if (!seenChildren.has(id)) orphans.push(id + ' | ' + d.title)
}

console.log('=== 族表校验 ===')
console.log('组数: ' + GROUPS.length)
const total = GROUPS.reduce((n, g) => n + (g.children || []).length, 0)
console.log('子症状引用总数: ' + total + '（去重后 ' + seenChildren.size + '）')
const multi = [...seenChildren.entries()].filter(([, v]) => v.length > 1)
console.log('多归属症状: ' + multi.length + ' 个')
for (const [c, gs] of multi) console.log('  ' + c + ' → ' + gs.join(' + '))

if (errors.length) {
  console.log('\n❌ 校验失败（' + errors.length + '）:')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}

console.log('\n未归族的症状: ' + orphans.length + ' 个')
for (const o of orphans) console.log('  ' + o)

function render(g) {
  return P.generatePluginSource({
    name: g.name,
    title: g.title,
    kind: 'symptom_group',
    forceKind: true,
    trigger: g.trigger,
    ask: g.ask,
    children: g.children,
    contraindications: [
      '【症状筛选组】只做粗筛，不参与证候/方剂的推理判定',
      '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立',
      '维度：' + g.dimension + '｜未归入本组的：' + g.notIncluded
    ]
  }).replace('  trigger(', '  // 症状筛选组（' + g.dimension + '）：' + g.title + '\n  trigger(')
}

if (!WRITE) {
  if (errors.length === 0) {
    console.log('\n=== 预览（前 3 个组的源码）===')
    for (const g of GROUPS.slice(0, 3)) {
      console.log('--- ' + g.name + ' ---')
      console.log(render(g))
    }
    console.log('（预览，加 --write 落库）')
  }
  process.exit(0)
}

for (const g of GROUPS) {
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', g.name + '.js'), render(g), 'utf8')
  console.log('  ＋ 症状组 ' + g.name + '（' + g.title + '）← ' + g.children.length + ' 个子症状')
}

const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const g of GROUPS) {
  prov.nodes[g.name] = {
    source: 'group',
    label: '症状筛选组（' + g.dimension + '维度）',
    refs: ['汇集：' + g.children.join('、')],
    by: 'system:symptom-group'
  }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n已写入 ' + GROUPS.length + ' 个症状筛选组 + provenance')
