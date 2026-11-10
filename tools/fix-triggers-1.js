'use strict'
// 修正几个真实的触发词问题（都是这轮实跑撞出来的）
//
// 1) jaundice「身黄/发黄」的裸「发黄」太宽：小便发黄、指甲发黄都会误点亮黄疸
//    → 去掉裸「发黄」，换成具体的「皮肤发黄/身上发黄/眼白发黄/眼睛发黄」
// 2) dark_urine 接不住「小便发黄」这种说法 → 补
// 3) pseudo_cold_heat 接不住「觉得冷可又不真冷」→ 补
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')
const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  {
    name: 'jaundice',
    trigger: ['身黄', '全身发黄', '皮肤黄', '皮肤发黄', '身上发黄', '目黄', '眼睛发黄', '眼白发黄', '黄疸', '橘子色', '如橘子色'],
    title: '皮肤眼睛发黄'
  },
  { name: 'dark_urine', add: ['小便发黄', '尿液发黄', '尿色发黄', '小便颜色发黄'] },
  { name: 'pseudo_cold_heat', add: ['觉得冷可又不真冷', '觉得冷又不太冷', '冷又不真冷', '热又不真热', '似冷非冷似热非热'] }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

for (const p of PATCHES) {
  const def = registry[p.name]
  const abs = path.join(PLUGINS, def.dir, def.file)
  const before = fs.readFileSync(abs, 'utf8')
  const cur = P.scanPluginSource(before).model
  const kws = (cur.meta.triggerKws || []).slice()
  let want
  if (p.trigger) want = p.trigger.slice()
  else want = kws.concat(p.add.filter(k => !kws.includes(k)))
  const removed = kws.filter(k => !want.includes(k))
  const added = want.filter(k => !kws.includes(k))
  console.log(p.name + ': ' + kws.length + ' → ' + want.length
    + (added.length ? ' (+' + added.join('、') + ')' : '')
    + (removed.length ? ' (−' + removed.join('、') + ')' : ''))
  if (WRITE) {
    const desired = { trigger: want }
    if (p.title) desired.title = p.title
    const r = P.patchPluginSource(before, desired)
    if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('  ✎ 已写盘') }
    for (const n of r.notes) console.log('    note: ' + n)
  }
}
