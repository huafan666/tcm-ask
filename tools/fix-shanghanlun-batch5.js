'use strict'
// tools/fix-shanghanlun-batch5.js
// ============================================================
// 伤寒论逐条过 · 第 5 批：少阳(10) / 太阴(8) / 霍乱(10) / 阴阳易差后劳复(7)
//
// 四篇合计 35 条，没有缺方；问题在「原文写出来的抓手没进 needs」：
//   · 396 条「大病差后，**喜唾**，久不了了，胸上有寒……宜理中丸」——理中丸原来只认吐利
//   · 386 条「霍乱，头痛发热，身疼痛，**热多欲饮水者，五苓散主之**」——和理中丸的分水岭就是渴
//   · 388 条「**吐利**汗出，发热恶寒，四肢拘急，**手足厥冷**者，四逆汤主之」
//
// 用法：
//   node tools/fix-shanghanlun-batch5.js           预览
//   node tools/fix-shanghanlun-batch5.js --write   落库
// ============================================================
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const PATCH = [
  {
    name: 'lizhong_wan',
    title: '理中丸',
    ref: '396条',
    why: '396条「大病差后，**喜唾**，久不了了，胸上有寒，当以丸药温之，宜理中丸」——喜唾（吐涎沫）是理中丸的另一个用法，原来只认「吐利 + 不渴」，这条完全进不来。',
    // 注意：lizhong_wan 建的时候 needs 写的是扁平单路径（['a','b','c']），不是 [[...]]
    before: ['vomiting.yes', 'diarrhea.yes', 'thirsty.no'],
    after: [
      ['vomiting.yes', 'diarrhea.yes', 'thirsty.no'],
      // 396 条：喜唾、胸上有寒
      ['saliva_spit.yes', 'thirsty.no']
    ]
  },
  {
    name: 'wuling_san',
    title: '五苓散',
    ref: '386条',
    why: '386条「霍乱，头痛发热，身疼痛，**热多欲饮水者，五苓散主之**；寒多不用水者，理中丸主之」——渴与不渴就是这两方的分水岭，五苓散原来四条路径都要「小便不利」或「呕+无汗」，认不出这条。',
    before: [
      ['thirsty.yes', 'urination_difficulty.yes'],
      ['thirsty.yes', 'vomiting.yes', 'no_sweat.yes'],
      ['below_palp.yes', 'saliva_spit.yes'],
      ['water_reflux.yes']
    ],
    after: [
      ['thirsty.yes', 'urination_difficulty.yes'],
      ['thirsty.yes', 'vomiting.yes', 'no_sweat.yes'],
      ['below_palp.yes', 'saliva_spit.yes'],
      ['water_reflux.yes'],
      // 386 条：霍乱吐利 + 欲饮水（对照理中丸的「不用水」）
      ['vomiting.yes', 'diarrhea.yes', 'thirsty.yes']
    ]
  },
  {
    name: 'sini_tang',
    title: '四逆汤',
    ref: '388条',
    why: '388条「**吐利**汗出，发热恶寒，四肢拘急，**手足厥冷**者，四逆汤主之」——吐利 + 手足厥冷 + 汗出是霍乱转四逆的典型，原来两条路径一条都不认（一条要下利清谷，一条要小便复利）。',
    before: [
      ['clear_grain_diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'xiaobian_fuli.yes', 'cold_extremities.yes']
    ],
    after: [
      ['clear_grain_diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'xiaobian_fuli.yes', 'cold_extremities.yes'],
      // 388 条：吐利 + 手足厥冷 + 汗出
      ['vomiting.yes', 'diarrhea.yes', 'cold_extremities.yes', 'sweat.yes'],
      // 389 条：既吐且利，小便复利而大汗出，下利清谷
      ['clear_grain_diarrhea.yes', 'diarrhea.yes', 'sweat.yes']
    ]
  }
]

const errors = []
for (const f of PATCH) {
  const d = registry[f.name]
  if (!d) { errors.push('找不到要改的方：' + f.name); continue }
  const now = JSON.stringify(d.needs || [])
  if (now !== JSON.stringify(f.before)) {
    errors.push(f.name + ' 现状与预期不一致：\n      实际 ' + now + '\n      预期 ' + JSON.stringify(f.before))
  }
  for (const p of f.after) {
    if (!p.length) errors.push(f.name + ' 有空路径')
    for (const c of p) {
      const dep = String(c).split('.')[0]
      if (!registry[dep]) errors.push(f.name + ' 引用了不存在的节点 ' + dep)
    }
  }
}

console.log('=== 伤寒论逐条过 · 第 5 批（少阳/太阴/霍乱/阴阳易 35 条）===')
console.log('缺方 0 个；修改 ' + PATCH.length + ' 个方的 needs：')
for (const f of PATCH) console.log('  ~ ' + f.title.padEnd(10) + f.ref.padEnd(7) + f.why)

if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}
if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

for (const f of PATCH) {
  const file = path.join(PLUGINS, 'formulas', f.name + '.js')
  const text = fs.readFileSync(file, 'utf8')
  const res = P.patchPluginSource(text, { needs: f.after.map(p => p.map(c => P.condToRef(c))) })
  if (!res.changed) { console.log('  （无变化）' + f.name); continue }
  fs.writeFileSync(file, res.text, 'utf8')
  console.log('  ~ ' + f.name + '  [' + res.changedFields.join(',') + ']')
  for (const n of res.notes) console.log('      注：' + n)
}
console.log('\n已写入 ' + PATCH.length + ' 处修改')
