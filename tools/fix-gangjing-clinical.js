'use strict'
// tools/fix-gangjing-clinical.js
// 按用户口径（临床优先）：刚痉补上「筋脉拘急」这一层，与柔痉对称。
//
// 刚痉（金匮2.1）：太阳病，发热无汗，反恶寒者，名曰刚痉。
//   原文只写了三个症状；但痉病必有筋脉拘急（项背强急），
//   否则普通风寒表实证（发热无汗恶寒）会被判成刚痉——临床上说不通。
//   needs: ['fever.yes', 'no_sweat.yes', 'cold_aversion.yes', 'neck_stiff_pain.yes']

const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const NEEDS = [['fever.yes', 'no_sweat.yes', 'cold_aversion.yes', 'neck_stiff_pain.yes']]

const CONTRA = [
  '太阳病发热无汗反恶寒，名曰刚痉（金匮2.1）',
  '痉病必有筋脉拘急（项背强急、身体强几几），故要求 neck_stiff_pain——否则普通风寒表实证会被误判',
  '与柔痉鉴别：无汗恶寒者为刚痉，汗出而不恶寒者为柔痉',
  '痉病误汗则表益虚、恶寒更甚',
  '欲作刚痉（无汗+口噤不得语+气上冲胸）主葛根汤'
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const def = registry.gang_jing
if (!def) { console.log('gang_jing 不存在'); process.exit(1) }
for (const c of NEEDS[0]) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('引用了不存在的节点: ' + dep); process.exit(1) }
}

const abs = path.join(PLUGINS, 'syndromes', def.file)
const before = fs.readFileSync(abs, 'utf8')
const cur = P.scanPluginSource(before).model
console.log('旧: ' + JSON.stringify(cur.needs.map(x => x.map(P.refToCond))))
console.log('新: ' + JSON.stringify(NEEDS))

if (WRITE) {
  const r = P.patchPluginSource(before, {
    needs: NEEDS.map(x => x.map(P.condToRef)),
    contraindications: CONTRA
  })
  if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('✎ 已写盘') }
  for (const n of r.notes) console.log('  note: ' + n)
} else {
  console.log('（预览，加 --write 写盘）')
}
