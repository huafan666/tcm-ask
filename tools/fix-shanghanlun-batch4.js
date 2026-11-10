'use strict'
// tools/fix-shanghanlun-batch4.js
// ============================================================
// 伤寒论逐条过 · 第 4 批：辨阳明病 84 条（179~262）
//
// 这一篇没有缺方，问题全在「原文特意写出来的鉴别点没进 needs」：
//   · 207 条「**不吐不下**，心烦者，可与调胃承气汤」——不吐不下是排除峻下的前提
//   · 208 条「**手足濈然汗出者，此大便已硬也**，大承气汤主之」——这个体征原来完全没认
//   · 213 条「其人多汗……大便必硬，硬则谵语，小承气汤主之」——小承气原来只认"喜冷饮+放屁"
//
// 用法：
//   node tools/fix-shanghanlun-batch4.js           预览
//   node tools/fix-shanghanlun-batch4.js --write   落库
// ============================================================
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

// ---------- 一、shouhan 这个节点只认「手汗」，认不出阳明的「手足濈然汗出」 ----------
const SHOUHAN_TRIGGER = ['手汗', '手出汗', '手足汗出', '手足出汗', '手足濈然汗出', '手足濈然',
  '濈然汗出', '手脚出汗', '手脚老出汗']

// ---------- 二、三个承气汤补条文里的鉴别条件 ----------
const PATCH = [
  {
    name: 'tiaowei_chengqi_tang',
    title: '调胃承气汤',
    ref: '207条',
    why: '207条「阳明病，**不吐不下**，心烦者，可与调胃承气汤」——原文特意点明"不吐不下"，是用来和「已吐已下致虚」划清界限的。原来四条路径全都不认这条。',
    before: [
      ['delirium.yes', 'cold_drink_desire.yes', 'cold_aversion.no', 'poor_complexion.no'],
      ['fever.yes', 'heat_only_no_chill.yes', 'constipation.yes']
    ],
    after: [
      ['delirium.yes', 'cold_drink_desire.yes', 'cold_aversion.no', 'poor_complexion.no'],
      ['fever.yes', 'heat_only_no_chill.yes', 'constipation.yes'],
      // 207 条：不吐不下 + 心烦（两个否定条件是这里的抓手，不是伴随症）
      ['restless.yes', 'vomiting.no', 'diarrhea.no', 'cold_aversion.no']
    ]
  },
  {
    name: 'dachengqi_tang',
    title: '大承气汤',
    ref: '208条',
    why: '208条「**手足濈然汗出者，此大便已硬也**，大承气汤主之」——手足濈然汗出是阳明腑实最硬的一个体征，原来十条路径一条都没用到它。',
    before: [
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'tidal_fever.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'delirium.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'left_abdomen_press_pain.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'flatus.no'],
      ['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes'],
      ['abdominal_fullness.yes', 'severe_abdominal_pain.yes'],
      ['diarrhea.yes', 'epigastric_lump_soft.yes'],
      ['postpartum.yes', 'constipation.yes', 'delirium.yes'],
      ['postpartum.yes', 'lochia_retention.yes', 'fever.yes'],
      ['fever.yes', 'sweat.yes', 'constipation.yes', 'cold_aversion.no', 'poor_complexion.no']
    ],
    after: [
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'tidal_fever.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'delirium.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'left_abdomen_press_pain.yes'],
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'flatus.no'],
      ['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes'],
      ['abdominal_fullness.yes', 'severe_abdominal_pain.yes'],
      ['diarrhea.yes', 'epigastric_lump_soft.yes'],
      ['postpartum.yes', 'constipation.yes', 'delirium.yes'],
      ['postpartum.yes', 'lochia_retention.yes', 'fever.yes'],
      ['fever.yes', 'sweat.yes', 'constipation.yes', 'cold_aversion.no', 'poor_complexion.no'],
      // 208 条：手足濈然汗出 + 大便硬 + 不恶寒
      ['shouhan.yes', 'constipation.yes', 'cold_aversion.no']
    ]
  },
  {
    name: 'xiaochengqi_tang',
    title: '小承气汤',
    ref: '213/214条',
    why: '213条「其人多汗，以津液外出，胃中燥，大便必硬，硬则谵语，小承气汤主之」；214条「谵语，发潮热」。原来的两条路径都要「喜冷饮+不恶寒+放屁」，一条都不认这两条。',
    before: [
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'flatus.yes'],
      ['diarrhea.yes', 'delirium.yes']
    ],
    after: [
      ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'flatus.yes'],
      ['diarrhea.yes', 'delirium.yes'],
      // 213 条：多汗 + 大便硬 + 谵语（津液外出致燥）
      ['sweat.yes', 'constipation.yes', 'delirium.yes'],
      // 214 条：谵语 + 潮热（与大承气的分立靠脉，无脉可凭时两者都留候选）
      ['delirium.yes', 'tidal_fever.yes']
    ]
  }
]

// ---------- 校验 ----------
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
if (!registry.shouhan) errors.push('找不到 shouhan 节点')

console.log('=== 伤寒论逐条过 · 第 4 批（辨阳明病 84 条）===')
console.log('缺方 0 个；改 1 个症状词表 + ' + PATCH.length + ' 个方的 needs：')
console.log('  ~ shouhan（手足出汗）词表补「手足濈然汗出」等 ' + SHOUHAN_TRIGGER.length + ' 个说法')
for (const f of PATCH) console.log('  ~ ' + f.title.padEnd(12) + f.ref.padEnd(10) + f.why)

if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}
if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

// ---------- 落库 ----------
{
  const file = path.join(PLUGINS, 'symptoms', 'shouhan.js')
  const text = fs.readFileSync(file, 'utf8')
  const res = P.patchPluginSource(text, { trigger: SHOUHAN_TRIGGER })
  if (res.changed) { fs.writeFileSync(file, res.text, 'utf8'); console.log('  ~ shouhan  [' + res.changedFields.join(',') + ']') }
  else console.log('  （shouhan 无变化）')
}
for (const f of PATCH) {
  const file = path.join(PLUGINS, 'formulas', f.name + '.js')
  const text = fs.readFileSync(file, 'utf8')
  const res = P.patchPluginSource(text, { needs: f.after.map(p => p.map(c => P.condToRef(c))) })
  if (!res.changed) { console.log('  （无变化）' + f.name); continue }
  fs.writeFileSync(file, res.text, 'utf8')
  console.log('  ~ ' + f.name + '  [' + res.changedFields.join(',') + ']')
  for (const n of res.notes) console.log('      注：' + n)
}
console.log('\n已写入 1 处词表 + ' + PATCH.length + ' 处 needs')
