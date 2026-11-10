'use strict'
// tools/apply-symptom-systems.js —— 生成「系统层」粗筛分组（按十问歌顺序）
//
// 每个系统是一个 kind:'symptom_group' 节点，额外带：
//   order    —— 十问歌顺序（1 寒热、2 汗、3 头身……）
//   isSystem —— 标记它是系统闸门（问诊时先问这个系统有没有问题）
// children 由它引用的既有「维度分组」自动合并去重，不重复维护。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const { SYSTEMS } = require(path.join(ROOT, 'data', 'symptom-systems.js'))
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
const warnings = []

// 每个系统把自己的 groups 的 children 合并，再并上 extra（不进任何维度分组、
// 但必须被这一问管住的症状，如「无汗」「恶心」「气上冲」）
for (const s of SYSTEMS) {
  const kids = []
  for (const g of s.groups) {
    const def = registry[g]
    if (!def) { errors.push(s.name + ' 引用了不存在的分组 ' + g); continue }
    if (def.kind !== 'symptom_group') { errors.push(s.name + ' 的成员 ' + g + ' 不是分组（kind=' + def.kind + '）'); continue }
    for (const c of (def.children || [])) if (!kids.includes(c)) kids.push(c)
  }
  for (const c of (s.extra || [])) {
    if (!registry[c]) { errors.push(s.name + ' 的 extra 引用了不存在的症状 ' + c); continue }
    if (!kids.includes(c)) kids.push(c)
  }
  s.children = kids
  if (!kids.length) errors.push(s.name + ' 没有任何子症状')
  if (registry[s.name] && registry[s.name].kind !== 'symptom_group') {
    errors.push(s.name + ' 与已有节点重名（kind=' + registry[s.name].kind + '）')
  }
}

// 一个症状属于几个系统？跨系统很正常（如便血=大便+出血），但太多说明划分有问题
const inSys = new Map()
for (const s of SYSTEMS) for (const c of s.children) {
  if (!inSys.has(c)) inSys.set(c, [])
  inSys.get(c).push(s.name)
}
const allSym = Object.keys(registry).filter(n => registry[n].kind === 'symptom')
const covered = allSym.filter(n => inSys.has(n))
const notCovered = allSym.filter(n => !inSys.has(n))
if (notCovered.length) warnings.push('未进任何系统的症状 ' + notCovered.length + ' 个：' + notCovered.join('、'))

console.log('=== 系统层校验 ===')
console.log('系统数 ' + SYSTEMS.length)
for (const s of SYSTEMS) {
  console.log('  ' + String(s.order).padStart(2) + '. ' + s.title.padEnd(20) + s.children.length + ' 个症状')
}
console.log('\n症状覆盖：' + covered.length + ' / ' + allSym.length +
  ' = ' + (covered.length / allSym.length * 100).toFixed(1) + '%')

const multi = [...inSys.entries()].filter(([, v]) => v.length > 1)
console.log('同时属于多个系统的症状：' + multi.length + ' 个')
for (const [c, v] of multi.slice(0, 15)) {
  console.log('  ' + c + ' → ' + v.join(' + '))
}

if (warnings.length) { console.log('\n提示：'); for (const w of warnings) console.log('  · ' + w) }
if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}

function render(s) {
  return P.generatePluginSource({
    name: s.name,
    title: s.title,
    kind: 'symptom_group',
    forceKind: true,
    trigger: [],          // 系统闸门不靠文字触发，只靠问诊回答
    ask: s.ask,
    children: s.children,
    order: s.order,
    isSystem: true,
    contraindications: [
      '【系统闸门】第 ' + s.order + ' 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理',
      '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）',
      '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统',
      '包含的维度分组：' + s.groups.join('、')
    ]
  }).replace('  ask:', '  // 系统闸门（十问歌第 ' + s.order + ' 问）\n  ask:')
}

if (!WRITE) {
  console.log('\n=== 预览前 2 个系统 ===')
  for (const s of SYSTEMS.slice(0, 2)) { console.log('--- ' + s.name + ' ---'); console.log(render(s)) }
  console.log('\n（预览，加 --write 落库）')
  process.exit(0)
}

for (const s of SYSTEMS) {
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
  console.log('  ＋ 系统 ' + s.name + '（' + s.title + '）← ' + s.children.length + ' 个症状')
}
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const s of SYSTEMS) {
  prov.nodes[s.name] = {
    source: 'system', label: '问诊系统层（十问歌第 ' + s.order + ' 问）',
    refs: ['维度分组：' + s.groups.join('、')], by: 'system:symptom-system'
  }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n已写入 ' + SYSTEMS.length + ' 个系统 + provenance')
