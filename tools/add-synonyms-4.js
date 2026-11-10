'use strict'
// 修正版补词：只按「完全相同」去重（上一版把"长词包含短词"当成已覆盖，导致短句永远匹配不上）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  { name: 'cold_extremities', add: ['手脚冰凉', '手脚冰', '四肢冰凉'] },
  { name: 'body_heavy', add: ['身上沉重', '浑身沉重', '身子沉重'] },
  { name: 'body_ache_stiff', add: ['浑身酸痛', '浑身酸痛翻不了身', '身体疼得动不了'] },
  { name: 'body_pain', add: ['全身都痛', '全身痛', '浑身都痛', '周身疼痛'] },
  { name: 'tidal_fever', add: ['下午发烧', '下午烧得厉害', '每天下午', '下午加重', '午后发热', '傍晚发热'] }
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
  const missing = p.add.filter(k => !kws.includes(k))       // 只按完全相同去重
  if (!missing.length) { console.log('· ' + p.name + ' 无需改动'); continue }
  console.log(p.name + ': ' + kws.length + ' → ' + (kws.length + missing.length) + ' (+' + missing.join('、') + ')')
  if (WRITE) {
    const r = P.patchPluginSource(before, { trigger: kws.concat(missing) })
    if (r.changed) fs.writeFileSync(abs, r.text, 'utf8')
  }
}
