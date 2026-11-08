'use strict'
// tools/find-node.js
// 建节点之前先查库：这个词/这个意思，库里是不是已经有症状、方剂、证候了？
// 重复建节点会让同一个病人在两条路径上被掰开，是这部分最贵的错误。
//
//   node tools/find-node.js 面赤 口噤 背反张
//   node tools/find-node.js --kind formula 桂枝
//   node tools/find-node.js            # 不带参数：列出所有症状标题，人工扫一眼

const path = require('path')
const { loadAll } = require(path.join(__dirname, '..', 'core/loader'))

const { registry, byKind } = loadAll(path.join(__dirname, '..', 'plugins'))

const args = process.argv.slice(2)
let kindFilter = null
const words = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--kind' || args[i] === '-k') { kindFilter = args[++i]; continue }
  words.push(args[i])
}

const KIND_CN = { symptom: '症状', pulse: '脉象', summary: '证候', formula: '方剂' }

function kwsOf(def) {
  if (typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  if (!m) return []
  return [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2])
}

if (!words.length) {
  for (const kind of ['symptom', 'pulse', 'summary', 'formula']) {
    const list = byKind[kind] || []
    if (!list.length) continue
    console.log('\n=== ' + KIND_CN[kind] + ' ' + list.length + ' 个 ===')
    console.log(list.map(n => registry[n].title + '(' + n + ')').join('  ·  '))
  }
  console.log('\n用法: node tools/find-node.js 面赤 口噤     # 建节点前查重')
  process.exit(0)
}

let anyHit = false
for (const w of words) {
  const hits = []
  for (const name of Object.keys(registry)) {
    const d = registry[name]
    if (!d || !d.kind) continue
    if (kindFilter && d.kind !== kindFilter) continue
    const reasons = []
    if ((d.title || '').includes(w)) reasons.push('标题含「' + w + '」')
    const kws = kwsOf(d)
    const hitKw = kws.filter(k => k.includes(w) || w.includes(k))
    if (hitKw.length) reasons.push('触发词 ' + hitKw.slice(0, 4).map(k => '「' + k + '」').join(''))
    if ((d.ask || '').includes(w)) reasons.push('反问话术含')
    if (reasons.length) hits.push({ name, title: d.title, kind: d.kind, reasons })
  }

  console.log('\n【' + w + '】' + (hits.length ? '' : '  ❗ 库里没有 → 需要新建'))
  for (const h of hits) {
    console.log('  ' + KIND_CN[h.kind] + ' ' + h.title + '  (' + h.name + ')   ← ' + h.reasons.join('；'))
  }
  if (hits.length) anyHit = true
}

if (anyHit) {
  console.log('\n注意：上面只要有一条语义等价，就必须复用已有节点，不要再建一个。')
  console.log('语义不完全等价（比如「面赤」vs「里寒外热(面赤)」）也要在提案里写明为什么不复用。')
}
