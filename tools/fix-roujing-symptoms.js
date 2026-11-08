'use strict'
// tools/fix-roujing-symptoms.js
// 按用户意见修正：柔痉不用「太阳病」证，也不把「不恶寒」当硬条件，只用临床症状。
//
// 柔痉（金匮2.2）原文：太阳病，发热汗出，而不恶寒，名曰柔痉。
//   · "太阳病" 不单独进条件（用户要求：柔痉单独用症状即可）
//   · "而不恶寒" 与库里「太阳之为病=颈项强痛+恶寒」冲突，且临床汗出者多以恶风为主
//     → 不作为判定条件，只在禁忌里作与刚痉的鉴别说明
//   · 痉病必见筋脉拘急，故用「身体强几几」= neck_stiff_pain
//
//   needs: ['fever.yes', 'sweat.yes', 'neck_stiff_pain.yes']
//
// 栝蒌桂枝汤（金匮2.11）：柔痉 + 身体强几几（方条比证条多这一层「其证备，身体强，几几然」）
//   needs: ['rou_jing.yes', 'neck_stiff_pain.yes']

const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const CH2 = '金匮要略·痉湿暍病脉证并治第二'

const PATCHES = [
  {
    name: 'rou_jing',
    dir: 'syndromes',
    needs: [['fever.yes', 'sweat.yes', 'neck_stiff_pain.yes']],
    contraindications: [
      '太阳病发热汗出，而不恶寒，名曰柔痉（金匮2.2）',
      '与刚痉鉴别：有汗无汗——无汗反恶寒者为刚痉，汗出者为柔痉',
      '原文作「不恶寒」，临床汗出者多以恶风为主，故不把「恶寒/不恶寒」作硬条件',
      '痉病误汗则表益虚，恶寒更甚',
      '主方栝蒌桂枝汤'
    ]
  },
  {
    name: 'gualou_guizhi_tang',
    dir: 'formulas',
    needs: [['rou_jing.yes', 'neck_stiff_pain.yes']],
    contraindications: [
      '柔痉主方：汗出、身体强几几而脉沉迟（桂枝汤加栝蒌根，解肌生津、舒缓筋脉）',
      '与葛根汤区别在有无汗出：汗出者本方，无汗而欲作刚痉者葛根汤',
      '条文本有脉反沉迟，脉象暂不入判定（本项目约定）',
      '取微汗，不可大汗；痉病误汗则表益虚、恶寒更甚'
    ]
  }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
for (const p of PATCHES) {
  if (!registry[p.name]) { errors.push(`${p.name} 不存在`); continue }
  for (const path1 of p.needs) {
    for (const c of path1) {
      const dep = String(c).split('.')[0]
      if (!registry[dep]) errors.push(`${p.name} 引用了不存在的节点 ${dep}`)
    }
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

for (const p of PATCHES) {
  const def = registry[p.name]
  const abs = path.join(PLUGINS, p.dir, def.file)
  const before = fs.readFileSync(abs, 'utf8')
  const cur = P.scanPluginSource(before).model
  console.log(`\n=== ${p.name} ===`)
  console.log('  旧: ' + JSON.stringify(cur.needs.map(x => x.map(P.refToCond))))
  console.log('  新: ' + JSON.stringify(p.needs))
  if (WRITE) {
    const r = P.patchPluginSource(before, {
      needs: p.needs.map(x => x.map(P.condToRef)),
      contraindications: p.contraindications
    })
    if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('  ✎ 已写盘') }
    for (const n of r.notes) console.log('    note: ' + n)
  }
}
if (!WRITE) console.log('\n（预览，加 --write 写盘）')
