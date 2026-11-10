'use strict'
// tools/apply-jingui-chuangyong-fix.js —— 批 19 修订
//
// 踩到引擎的 anyPathBlocked 语义：**任一路径被明确否定 → 整个节点判 no**。
// 原来 肠痈 的第 2 条路径要求 fever.yes，病人一说「不发烧」就把整个肠痈判成 no，
// 于是「肠痈 + 不发热 → 薏苡附子败酱散」这个组合永远进不去。
//
// 修法（符合既定口径「多路径间禁止同节点 yes/no 互斥」）：
//   证候 肠痈 只挂「少腹肿痞、按之痛、腹皮急、甲错」这些定性症状，**不再涉及发热**
//   发热 / 不发热 的区分交给两个方剂：
//     大黄牡丹汤（脓未成、有热）→ fever.yes
//     薏苡附子败酱散（脓已成、无热）→ fever.no
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const CHANG_YONG = [
  // 少腹肿痞 + 小便自调（与淋证鉴别）
  ['lower_abdomen_swelling_pain.yes', 'urination_difficulty.no'],
  // 少腹按之痛 + 腹皮急
  ['lower_abdomen_swelling_pain.yes', 'abdominal_tension.yes'],
  // 少腹按之痛 + 自汗出
  ['lower_abdomen_swelling_pain.yes', 'sweat.yes'],
  // 腹皮急 + 肌肤甲错（久病成脓）
  ['abdominal_tension.yes', 'skin_scaly.yes'],
  // 少腹按之痛就够（最常见的主诉）
  ['lower_abdomen_swelling_pain.yes']
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
for (const p of CHANG_YONG) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

const f = path.join(PLUGINS, 'syndromes', 'chang_yong.js')
const src = fs.readFileSync(f, 'utf8')
const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
const def = registry.chang_yong

const model = {
  name: 'chang_yong', title: def.title, kind: 'summary', comment,
  needs: CHANG_YONG,
  contraindications: (def.contraindications || []).concat([
    '⚠ 本节点刻意不含「发热/不发热」——因为引擎语义是「任一路径被否定则整节点判 no」，' +
    '若此处要求发热，病人一说「不发烧」整个肠痈就被判无。发热与否交给两个方剂各自区分'
  ])
}

if (WRITE) {
  fs.writeFileSync(f, render(model), 'utf8')
  console.log('  ~ chang_yong 改为 ' + CHANG_YONG.length + ' 条路径（不再含 fever）')
  console.log('\n完成')
} else {
  console.log(JSON.stringify(CHANG_YONG))
}
