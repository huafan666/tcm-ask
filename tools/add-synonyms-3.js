'use strict'
// 补 constipation / easy_urination 的口语说法，然后用原句重测「去桂加白术汤」
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  { name: 'constipation', add: ['大便干硬', '大便干', '大便坚硬', '排便困难', '大便秘结'] },
  { name: 'easy_urination', add: ['小便很通畅', '小便通利', '小便顺畅', '尿得顺畅'] }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

for (const p of PATCHES) {
  const def = registry[p.name]
  const abs = path.join(PLUGINS, def.dir, def.file)
  const before = fs.readFileSync(abs, 'utf8')
  const cur = P.scanPluginSource(before).model
  const kws = (cur.meta.triggerKws || []).slice()
  const missing = p.add.filter(k => !kws.some(x => x === k || x.includes(k) || k.includes(x)))
  if (!missing.length) { console.log('· ' + p.name + ' 无需改动'); continue }
  console.log(p.name + ': ' + kws.length + ' → ' + (kws.length + missing.length) + ' (+' + missing.join('、') + ')')
  if (WRITE) {
    const r = P.patchPluginSource(before, { trigger: kws.concat(missing) })
    if (r.changed) fs.writeFileSync(abs, r.text, 'utf8')
  }
}
