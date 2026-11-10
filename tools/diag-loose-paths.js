'use strict'
// tools/diag-loose-paths.js —— 诊断「单症状即可成立」的路径，按来源分类
//
// 目的：区分两类，处理方式完全不同
//   A. 条文方（伤寒论/金匮要略原方）：如果原文本来就只有一个症状，加条件反而是篡改原文
//   B. 手工方（药味组合、自造方）：没有条文约束，本就该收紧
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const prov = require(path.join(ROOT, 'plugins', 'provenance.json'))

const e = new Engine(registry)
const src = id => (prov.nodes && prov.nodes[id] && prov.nodes[id].source) || 'unlabeled'

const groups = { classic: [], hand: [] }
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'formula' || !d.needs || !d.needs.length) continue
  const loose = []
  for (const p of e.normalizeNeeds(d.needs)) {
    if (p.length !== 1) continue
    const dep = e.splitRef(p[0])[0]
    const t = registry[dep]
    const isLeaf = t && typeof t.trigger === 'function' && (!t.needs || !t.needs.length)
    if (isLeaf) loose.push(t.title)
  }
  if (!loose.length) continue
  const s = src(id)
  const rec = { id, title: d.title, src: s, loose, paths: e.normalizeNeeds(d.needs).length }
  if (s === 'shanghanlun' || s === 'jinkui') groups.classic.push(rec)
  else groups.hand.push(rec)
}

const show = (name, arr) => {
  console.log('\n=== ' + name + '（' + arr.length + ' 个方剂）===')
  for (const r of arr) {
    console.log('  ' + r.title.padEnd(24) + '[' + r.src + '] 共' + r.paths + '条路径')
    console.log('      单症状路径：' + r.loose.join('、'))
  }
}
show('A. 条文方（有伤寒/金匮出处）—— 加条件要小心，不能篡改原文', groups.classic)
show('B. 手工/药味方（无条文出处）—— 本就该收紧', groups.hand)

console.log('\n=== 汇总 ===')
console.log('条文方 ' + groups.classic.length + ' 个，手工方 ' + groups.hand.length + ' 个')
