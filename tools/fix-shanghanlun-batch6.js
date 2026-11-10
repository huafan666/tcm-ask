'use strict'
// tools/fix-shanghanlun-batch6.js
// ============================================================
// 伤寒论逐条过 · 第 6 批（最后一批）：辨少阴病 45 条 + 辨厥阴病 56 条 = 101 条
//
// 这批有两件事：
//   一、补最后 1 个缺方：麻黄附子甘草汤（302 条）。
//       注意它和金匮的「麻黄附子汤」（一身悉肿、水气病）不是同一首方，不能复用。
//   二、少阴/厥阴这两篇的抓手在原文里写得很密，但当年落库时基本只挑了「正证」，
//       把「无里证」「口中和」「身反不恶寒」「里有热」这些鉴别句全丢了。
//
// 用法：
//   node tools/fix-shanghanlun-batch6.js           预览
//   node tools/fix-shanghanlun-batch6.js --write   落库
// ============================================================
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

// ---------- 一、最后 1 个缺方 ----------
const NEW = [
  {
    name: 'mahuang_fuzi_gancao_tang',
    title: '麻黄附子甘草汤',
    refs: ['302'],
    note: '302条：少阴病，得之二三日，麻黄附子甘草汤微发汗。以二三日无里证，故微发汗也。',
    needs: [
      // 少阴本证（恶寒、但欲寐）＋「无里证」（无下利、无呕）
      ['cold_aversion.yes', 'sleepy.yes', 'diarrhea.no', 'vomiting.no']
    ],
    contra: [
      '302条：少阴病得之二三日，无里证，微发汗',
      '麻黄、附子、甘草——温经解表，比麻黄细辛附子汤更缓（去细辛加甘草）',
      '与麻黄细辛附子汤的区别：彼有「反发热」，本条病程稍久、热不显，故用甘草缓之',
      '⚠ 与金匮的「麻黄附子汤」（一身悉肿、水气病）不是同一首方，不要混用',
      '少阴禁汗，这里是「微发汗」，不可当太阳表实大发'
    ]
  }
]

// ---------- 二、补少阴/厥阴的鉴别条件 ----------
const PATCH = [
  {
    name: 'zhenwu_tang',
    title: '真武汤',
    ref: '316条',
    why: '316条「少阴病……腹痛，小便不利，四肢沉重疼痛，自下利者，此为有水气」——真武汤原来五条路径全都要「心悸」或「头眩」，而 316 条这条主文一个都没有，进不来。',
    before: [
      ['heart_palp.yes', 'dizziness.yes', 'cold_drink_desire.no'],
      ['heart_palp.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
      ['heart_palp.yes', 'unsteady_stance.yes', 'cold_drink_desire.no'],
      ['dizziness.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
      ['dizziness.yes', 'unsteady_stance.yes', 'cold_drink_desire.no']
    ],
    after: [
      ['heart_palp.yes', 'dizziness.yes', 'cold_drink_desire.no'],
      ['heart_palp.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
      ['heart_palp.yes', 'unsteady_stance.yes', 'cold_drink_desire.no'],
      ['dizziness.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
      ['dizziness.yes', 'unsteady_stance.yes', 'cold_drink_desire.no'],
      // 316 条：水气——小便不利 + 四肢沉重 + 自下利
      ['urination_difficulty.yes', 'limb_heavy_powerless.yes', 'diarrhea.yes']
    ]
  },
  {
    name: 'zhuling_tang',
    title: '猪苓汤',
    ref: '319条',
    why: '319条「少阴病，下利六七日，咳而呕渴，心烦不得眠者，猪苓汤主之」——原来两条路径都要「小便不利」，可 319 条通篇没提小便，进不来。',
    before: [
      ['severe_thirst.yes', 'urination_difficulty.yes'],
      ['urination_difficulty.yes', 'thirsty.yes', 'fever.yes']
    ],
    after: [
      ['severe_thirst.yes', 'urination_difficulty.yes'],
      ['urination_difficulty.yes', 'thirsty.yes', 'fever.yes'],
      // 319 条：下利 + 呕 + 渴 + 心烦不得眠（阴虚水热互结）
      ['diarrhea.yes', 'vomiting.yes', 'thirsty.yes', 'vex_insomnia.yes']
    ]
  },
  {
    name: 'fuzi_tang',
    title: '附子汤',
    ref: '304条',
    why: '304条「少阴病，得之一二日，**口中和**，其背恶寒者，当灸之，附子汤主之」——「口中和」（不苦不燥不渴）是它的抓手，也是和黄连阿胶汤的分水岭；原来两条路径都要「身疼痛」。',
    before: [
      ['body_pain.yes', 'cold_extremities.yes', 'joint_pain_rigid.yes'],
      ['body_pain.yes', 'cold_extremities.yes', 'cold_drink_desire.no']
    ],
    after: [
      ['body_pain.yes', 'cold_extremities.yes', 'joint_pain_rigid.yes'],
      ['body_pain.yes', 'cold_extremities.yes', 'cold_drink_desire.no'],
      // 304 条：背恶寒 + 手足寒 + 口中和（不渴）
      ['back_cold_patch.yes', 'cold_extremities.yes', 'thirsty.no']
    ]
  },
  {
    name: 'sini_tang',
    title: '四逆汤',
    ref: '324/353/354条',
    why: '324条「膈上有寒饮，干呕者……当温之，宜四逆汤」；353条「大汗出，热不去，内拘急，四肢疼，又下利厥逆而恶寒」；354条「大汗，若大下利而厥冷者」。原四条路径一条都不认。',
    before: [
      ['clear_grain_diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'xiaobian_fuli.yes', 'cold_extremities.yes'],
      ['vomiting.yes', 'diarrhea.yes', 'cold_extremities.yes', 'sweat.yes'],
      ['clear_grain_diarrhea.yes', 'diarrhea.yes', 'sweat.yes']
    ],
    after: [
      ['clear_grain_diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'xiaobian_fuli.yes', 'cold_extremities.yes'],
      ['vomiting.yes', 'diarrhea.yes', 'cold_extremities.yes', 'sweat.yes'],
      ['clear_grain_diarrhea.yes', 'diarrhea.yes', 'sweat.yes'],
      // 324 条：干呕 + 手足寒 + 不渴（膈上有寒饮）
      ['vomiting.yes', 'cold_extremities.yes', 'thirsty.no'],
      // 353/354 条：大汗 + 下利 + 厥逆
      ['sweat.yes', 'diarrhea.yes', 'cold_extremities.yes']
    ]
  },
  {
    name: 'dachengqi_tang',
    title: '大承气汤',
    ref: '321/322条',
    why: '少阴三急下：321条「自利清水，色纯青，心下必痛，口干燥者，急下之」；322条「腹胀不大便者，急下之」。前者是热结旁流（下利却是实证），后者是腹胀不大便——原来十一条路径一条都不认。',
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
      ['fever.yes', 'sweat.yes', 'constipation.yes', 'cold_aversion.no', 'poor_complexion.no'],
      ['shouhan.yes', 'constipation.yes', 'cold_aversion.no']
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
      ['shouhan.yes', 'constipation.yes', 'cold_aversion.no'],
      // 321 条：自利清水（热结旁流）+ 心下必痛 + 口干燥
      ['diarrhea.yes', 'epigastric_pressing_pain.yes', 'mouth_dry.yes'],
      // 322 条：腹胀不大便
      ['abdominal_fullness.yes', 'constipation.yes']
    ]
  },
  {
    name: 'wumei_wan',
    title: '乌梅丸',
    ref: '326条',
    why: '326条厥阴提纲「消渴，气上撞心，心中疼热，**饥而不欲食**，食则吐蛔」——「饥不欲食」这一对矛盾症状是厥阴病的关键，原来四条路径只有吐蛔/久利/气上冲，认不出提纲。',
    before: [
      ['round_worm_vomit.yes', 'restless.yes'],
      ['chronic_diarrhea.yes'],
      ['chongji.yes'],
      ['round_worm_vomit.yes', 'restless.yes', 'vomiting.yes']
    ],
    after: [
      ['round_worm_vomit.yes', 'restless.yes'],
      ['chronic_diarrhea.yes'],
      ['chongji.yes'],
      ['round_worm_vomit.yes', 'restless.yes', 'vomiting.yes'],
      // 326 条：气上撞心 + 饥而不欲食
      ['qi_surge.yes', 'hungry.yes', 'low_appetite.yes']
    ]
  },
  {
    name: 'baihu_tang',
    title: '白虎汤',
    ref: '350条',
    why: '350条「伤寒，脉滑而厥者，**里有热**，白虎汤主之」——这是真热假寒：手足厥冷却是里热。原来两条路径都要「大烦渴」，认不出这种「厥而喜冷饮」的。',
    before: [
      ['severe_thirst.yes', 'cold_aversion.no', 'mouth_dry.no'],
      ['zijue_shenre.yes', 'shuangzu_re.yes', 'shouhan.yes', 'dark_urine.yes', 'cold_aversion.no']
    ],
    after: [
      ['severe_thirst.yes', 'cold_aversion.no', 'mouth_dry.no'],
      ['zijue_shenre.yes', 'shuangzu_re.yes', 'shouhan.yes', 'dark_urine.yes', 'cold_aversion.no'],
      // 350 条：手足厥冷但喜冷饮 —— 脉滑而厥，里有热（真热假寒）
      ['cold_extremities.yes', 'cold_drink_desire.yes']
    ]
  },
  {
    name: 'wuzhuyu_tang',
    title: '吴茱萸汤',
    ref: '378条',
    why: '378条「干呕，吐涎沫，**头痛**者，吴茱萸汤主之」——厥阴头痛是这条的特异点，原来五条路径一条都没用到「头痛」。',
    before: [
      ['vomit_on_food.yes', 'cold_drink_desire.no'],
      ['vomit_saliva.yes', 'cold_drink_desire.no'],
      ['cold_extremities.yes', 'restless.yes', 'diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'chest_fullness.yes'],
      ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes']
    ],
    after: [
      ['vomit_on_food.yes', 'cold_drink_desire.no'],
      ['vomit_saliva.yes', 'cold_drink_desire.no'],
      ['cold_extremities.yes', 'restless.yes', 'diarrhea.yes', 'cold_drink_desire.no'],
      ['vomiting.yes', 'chest_fullness.yes'],
      ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes'],
      // 378 条：干呕 + 吐涎沫 + 头痛（厥阴头痛）
      ['vomiting.yes', 'saliva_spit.yes', 'headache.yes']
    ]
  }
]

// ---------- 校验 ----------
const errors = []
for (const f of NEW) {
  if (registry[f.name]) errors.push('已存在：' + f.name)
  const clash = Object.values(registry).find(d => d.kind === 'formula' && d.title === f.title)
  if (clash) errors.push(f.title + ' 与已有方 ' + clash.name + ' 标题重复')
  for (const p of f.needs) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(f.name + ' 引用了不存在的节点 ' + dep)
  }
}
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

console.log('=== 伤寒论逐条过 · 第 6 批（少阴 45 + 厥阴 56 = 101 条）===')
console.log('新建 ' + NEW.length + ' 个方：')
for (const f of NEW) console.log('  ＋ ' + f.title.padEnd(12) + f.name.padEnd(30) + '条 ' + f.refs.join('/'))
console.log('修改 ' + PATCH.length + ' 个已有方的 needs：')
for (const f of PATCH) console.log('  ~ ' + f.title.padEnd(10) + f.ref.padEnd(14) + f.why)

if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}
if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

for (const f of NEW) {
  const src = P.generatePluginSource({
    name: f.name, title: f.title, kind: 'formula', forceKind: true,
    needs: f.needs.map(p => p.map(c => P.condToRef(c))),
    contraindications: f.contra
  }).replace('  needs:', '  // ' + f.note + '\n  needs:')
  fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), src, 'utf8')
  console.log('  ＋ ' + f.name)
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
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const f of NEW) {
  prov.nodes[f.name] = { source: 'shanghanlun', label: '伤寒论原方', refs: f.refs.slice(), by: 'system:shanghanlun-batch6' }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n已写入 ' + NEW.length + ' 新建 + ' + PATCH.length + ' 修改 + provenance')
