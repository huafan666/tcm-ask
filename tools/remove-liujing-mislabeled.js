'use strict'
// tools/remove-六经-mislabeled.js —— 删除「类型标错」的节点并修好引用
//
// 用户决定：这部分区分不够明确，去掉。
//
// 要删的 6 个（本质不是「症状」，而是六经标记 / 证候性质判断）：
//   shaoyang 少阳、shaoyin 少阴、yangming 阳明            → 六经标记
//   true_cold_false_heat 真寒假热、true_heat_false_cold 真热假寒、
//   inner_cold_outer_heat 里寒外热                        → 证候性质判断
// 连带删除：
//   still_sun「未传阳明少阳」—— 整个节点只由六经标记组成，是传变判断，无引用
//
// **保留** pseudo_cold_heat「似冷非冷似热非热」：
//   它是金匮 3.1 原文「如寒无寒，如热无热」的病人**自述感觉**，是真症状，不是证候判断。
//
// 引用修复：这三组六经标记其实是**冗余代理**，它们的内容在具体症状节点里都有：
//   少阳 = 口苦 + 往来寒热 + 胸胁苦满 → bitter_taste / alternating_cold_heat / hypochondriac_fullness
//   阳明 = 大便不通 + 潮热           → constipation / tidal_fever
//   少阴 = 但欲寐 + 没精神           → sleepy / low_energy
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const DELETE = [
  'shaoyang', 'shaoyin', 'yangming',
  'true_cold_false_heat', 'true_heat_false_cold', 'inner_cold_outer_heat',
  'still_sun'
]

// 引用方 needs 改写（用条文里的具体症状替掉六经/证候性质代理）
const REWRITE = {
  // 314/315 条：少阴病下利。少阴的核心是「但欲寐」→ sleepy
  baitong_tang: [
    ['diarrhea.yes', 'sleepy.yes', 'cold_aversion.yes', 'cold_drink_desire.no']
  ],
  // 305 条：少阴病身体痛、手足寒、骨节痛 → 三个具体症状直接对应条文
  fuzi_tang: [
    ['body_pain.yes', 'cold_extremities.yes', 'joint_pain_rigid.yes'],
    ['body_pain.yes', 'cold_extremities.yes', 'cold_drink_desire.no']
  ],
  // 317 条：下利清谷、里寒外热、手足厥逆、身反不恶寒、面色赤
  // 「里寒外热」拆成「面赤(面色赤) + 不恶寒(身反不恶寒)」
  tongmai_sini_tang: [
    ['clear_grain_diarrhea.yes', 'mian_chi.yes', 'cold_extremities.yes', 'cold_aversion.no'],
    ['diarrhea.yes', 'cold_extremities.yes', 'sweat.yes']
  ]
}

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
for (const id of DELETE) if (!registry[id]) errors.push('要删的节点不存在: ' + id)
for (const [id, paths] of Object.entries(REWRITE)) {
  if (!registry[id]) { errors.push('要改的节点不存在: ' + id); continue }
  for (const p of paths) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(id + ' 新路径引用了不存在的 ' + dep)
    if (DELETE.includes(dep)) errors.push(id + ' 新路径仍然引用被删节点 ' + dep)
  }
}

// 除了 REWRITE 里修好的，不允许还有别处引用被删节点
const handled = Object.keys(REWRITE).concat(DELETE)
const leftover = []
for (const [id, d] of Object.entries(registry)) {
  if (handled.includes(id)) continue
  if (!d.needs) continue
  const paths = Array.isArray(d.needs[0]) ? d.needs : [d.needs]
  for (const p of paths) for (const c of (p || [])) {
    const dep = String(c).split('.')[0]
    if (DELETE.includes(dep)) leftover.push(id + ' → ' + c)
  }
}
for (const l of leftover) errors.push('未处理的引用: ' + l)

// 组里不能含被删节点
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'symptom_group') continue
  for (const c of (d.children || [])) {
    if (DELETE.includes(c)) errors.push('组 ' + id + ' 含被删节点 ' + c)
  }
}

if (errors.length) {
  console.log('❌ 校验失败:')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

function commentOf(id, dir) {
  const f = path.join(PLUGINS, dir, id + '.js')
  const src = fs.readFileSync(f, 'utf8')
  const m = /^\/\/\s*(.+)$/m.exec(src)
  return m ? m[1] : ''
}

console.log('=== 将删除 ' + DELETE.length + ' 个节点 ===')
for (const id of DELETE) console.log('  － ' + id + '「' + registry[id].title + '」')

console.log('\n=== 将改写 ' + Object.keys(REWRITE).length + ' 个节点的 needs ===')
for (const [id, paths] of Object.entries(REWRITE)) {
  console.log('  ~ ' + id + '（' + registry[id].title + '）')
  for (const p of paths) console.log('      ' + p.join(' + '))
}

if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

// 1. 改写引用方
for (const [id, paths] of Object.entries(REWRITE)) {
  const def = registry[id]
  const dir = def.kind === 'formula' ? 'formulas' : 'syndromes'
  const f = path.join(PLUGINS, dir, id + '.js')
  const src = fs.readFileSync(f, 'utf8')
  fs.writeFileSync(f, render({
    name: id, title: def.title, kind: def.kind,
    comment: commentOf(id, dir),
    needs: paths,
    contraindications: (def.contraindications || []).slice()
  }), 'utf8')
  console.log('  ~ ' + id + ' 已改写')
}

// 2. 删文件 + 清 provenance + 清画布坐标
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
const LAYOUT = path.join(PLUGINS, '.layout.json')
const layout = JSON.parse(fs.readFileSync(LAYOUT, 'utf8'))
const box = layout.nodes || layout

for (const id of DELETE) {
  for (const d of ['symptoms', 'syndromes', 'formulas', 'pulses']) {
    const f = path.join(PLUGINS, d, id + '.js')
    if (fs.existsSync(f)) fs.unlinkSync(f)
  }
  if (prov.nodes && prov.nodes[id]) delete prov.nodes[id]
  if (box[id]) delete box[id]
  console.log('  － 已删除 ' + id)
}

fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2) + '\n', 'utf8')
console.log('\n完成')
