'use strict'
// 给两个已有症状补口语说法（同义即同节点，不新建节点）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  { name: 'chest_fullness', add: ['胸口发满', '胸里发满', '胸前发满', '胸口胀满'] },
  { name: 'limb_spasm', add: ['脚抽筋', '腿抽筋', '手脚抽筋', '四肢抽搐'] }
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
  if (!missing.length) { console.log(`· ${p.name} 无需改动`); continue }
  const want = kws.concat(missing)
  console.log(`${p.name}: ${kws.length} → ${want.length} 个关键词  (+${missing.join('、')})`)
  if (WRITE) {
    const r = P.patchPluginSource(before, { trigger: want })
    if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('  ✎ 已写盘') }
    for (const n of r.notes) console.log('    note: ' + n)
  }
}
if (!WRITE) console.log('\n（预览，加 --write 写盘）')
