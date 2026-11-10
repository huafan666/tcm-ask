'use strict'
// 给百合病相关节点补口语说法（只按完全相同去重）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')
const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  { name: 'appetite_fluctuating', add: ['想吃吃不下', '想吃东西又吃不下', '想吃东西可又吃不下', '吃不下饭又想吃'] },
  { name: 'bitter_taste', add: ['口苦', '嘴里苦'] },
  { name: 'cannot_walk', add: ['想走走不动', '想起来走又没劲'] }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

for (const p of PATCHES) {
  const def = registry[p.name]
  if (!def) { console.log('· ' + p.name + ' 不存在'); continue }
  const abs = path.join(PLUGINS, def.dir, def.file)
  const before = fs.readFileSync(abs, 'utf8')
  const cur = P.scanPluginSource(before).model
  const kws = (cur.meta.triggerKws || []).slice()
  const missing = p.add.filter(k => !kws.includes(k))
  if (!missing.length) { console.log('· ' + p.name + ' 无需改动'); continue }
  console.log(p.name + ': ' + kws.length + ' → ' + (kws.length + missing.length) + ' (+' + missing.join('、') + ')')
  if (WRITE) {
    const r = P.patchPluginSource(before, { trigger: kws.concat(missing) })
    if (r.changed) fs.writeFileSync(abs, r.text, 'utf8')
  }
}
