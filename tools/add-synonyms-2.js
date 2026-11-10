'use strict'
// 给这几个节点补口语说法（同义即同节点），然后用原句重测
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const PATCHES = [
  { name: 'body_heavy', add: ['身上发沉', '浑身发沉', '身子发沉', '腿发沉', '觉得沉'] },
  { name: 'sweat', add: ['出很多汗', '大汗', '一身汗', '出了汗', '汗多'] },
  { name: 'thirsty', add: ['口很渴', '很渴', '口干舌燥', '渴得厉害', '想喝水'] },
  { name: 'urination_difficulty', add: ['小便不顺畅', '小便不通畅', '尿不顺畅', '尿得费劲'] },
  { name: 'body_ache_stiff', add: ['浑身酸痛', '浑身又酸又痛', '翻身困难', '翻不了身', '身体疼得转不了身'] },
  { name: 'joint_pain_rigid', add: ['关节又酸又痛', '关节痛得弯不下去', '关节伸不直', '弯不下去'] }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

for (const p of PATCHES) {
  const def = registry[p.name]
  if (!def) { console.log('· ' + p.name + ' 不存在，跳过'); continue }
  const abs = path.join(PLUGINS, def.dir, def.file)
  const before = fs.readFileSync(abs, 'utf8')
  const cur = P.scanPluginSource(before).model
  const kws = (cur.meta.triggerKws || []).slice()
  const missing = p.add.filter(k => !kws.some(x => x === k || x.includes(k) || k.includes(x)))
  if (!missing.length) { console.log('· ' + p.name + ' 无需改动'); continue }
  console.log(p.name + ': ' + kws.length + ' → ' + (kws.length + missing.length) + ' 个关键词  (+' + missing.join('、') + ')')
  if (WRITE) {
    const r = P.patchPluginSource(before, { trigger: kws.concat(missing) })
    if (r.changed) fs.writeFileSync(abs, r.text, 'utf8')
  }
}
if (!WRITE) console.log('\n（预览，加 --write 写盘）')
