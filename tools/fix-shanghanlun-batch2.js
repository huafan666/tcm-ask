'use strict'
// tools/fix-shanghanlun-batch2.js
// ============================================================
// 伤寒论逐条过 · 第 2 批：辨太阳病（中）97 条
//
// 两件事：
//   一、补 4 个「条文点了、库里没有」的方
//   二、给 8 个已有的方补上条文里写着、但当初落库时丢掉的鉴别条件
//       ——重点就是「不呕 / 不渴 / 恶寒但热 / 不下利」这类否定条件
//
// 用法：
//   node tools/fix-shanghanlun-batch2.js           预览 diff
//   node tools/fix-shanghanlun-batch2.js --write   落库
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

// ---------- 一、新建 4 个方 ----------
const NEW = [
  {
    name: 'gegen_huangqin_huanglian_tang',
    title: '葛根黄芩黄连汤',
    refs: ['34'],
    note: '34条：太阳病，桂枝证，医反下之，利遂不止。脉促者，表未解也，喘而汗出者，葛根黄芩黄连汤主之。',
    needs: [
      // 抓手三件齐：下利（利遂不止）+ 喘 + 汗出
      ['diarrhea.yes', 'chuan.yes', 'sweat.yes']
    ],
    contra: [
      '34条：桂枝证误下后，利遂不止，喘而汗出',
      '葛根解表、芩连清里——表里双解',
      '与葛根汤的区别：葛根汤是无汗（表实），本方是汗出而喘（里热已起）',
      '与麻杏石甘汤的区别：本方必有下利，麻杏石甘没有'
    ]
  },
  {
    name: 'mahuang_xixin_fuzi_tang',
    title: '麻黄细辛附子汤',
    refs: ['301'],
    note: '301条：少阴病，始得之，反发热，脉沉者，麻黄细辛附子汤主之。',
    needs: [
      // 「反发热」＝少阴病本不当热而反热，故发热+恶寒+但欲寐（少阴阳虚）
      ['fever.yes', 'cold_aversion.yes', 'sleepy.yes']
    ],
    contra: [
      '301条：少阴病始得之，反发热，脉沉者',
      '「反发热」是太阳少阴两感：本应但寒不热，却见发热',
      '麻黄附子细辛——温经解表，助阳发汗',
      '与麻黄附子汤的区别：彼为水气（一身悉肿），本方为少阴表证发热',
      '⚠ 少阴禁汗，本方是温经而非大发汗，用量宜轻'
    ]
  },
  {
    name: 'sini_jia_renshen_tang',
    title: '四逆加人参汤',
    refs: ['385'],
    note: '385条：恶寒脉微而复利，利止亡血也，四逆加人参汤主之。',
    needs: [
      // 四逆汤证（恶寒、手足厥冷、下利）＋ 亡血（气色差、津血已伤）
      ['cold_aversion.yes', 'cold_extremities.yes', 'diarrhea.yes', 'poor_complexion.yes']
    ],
    contra: [
      '385条：恶寒脉微而复利，利止亡血也',
      '四逆汤加人参，回阳之中兼顾津血',
      '⚠「利止」不是病愈——是津血已竭、无物可下，比下利不止更危',
      '与四逆汤的区别：本方多一个「亡血」（气色差、津血伤）'
    ]
  },
  {
    name: 'zhishi_zhizi_chi_tang',
    title: '枳实栀子豉汤',
    refs: ['393'],
    note: '393条：大病差后，劳复者，枳实栀子豉汤主之。',
    needs: [
      // 原文抓手只有「大病差后，劳复」——病后因劳而复发，表现为虚烦发热
      ['fever.yes', 'vex_insomnia.yes', 'cold_aversion.no']
    ],
    contra: [
      '393条：大病差后，劳复者',
      '枳实、栀子、豆豉——清热除烦、宽中下气；有宿食者加大黄',
      '「劳复」指大病初愈因劳累而复发热，不是新感外邪（故不恶寒）',
      '⚠ 原文症状描述很简略，本方判据的可信度低于其它方'
    ]
  }
]

// ---------- 二、给已有的方补/改 needs ----------
// 每一条都写明「第几条的哪几个字」——不是凭感觉加的
const PATCH = [
  {
    name: 'ganjiang_fuzi_tang',
    title: '干姜附子汤',
    ref: '61条',
    why: '原文「不呕，不渴，无表证……身无大热」四个否定条件，原来一条都没落进 needs',
    before: [['day_agitated_night_calm.yes', 'cold_drink_desire.no']],
    after: [
      ['day_agitated_night_calm.yes', 'thirsty.no', 'vomiting.no', 'cold_aversion.no']
    ]
  },
  {
    name: 'fuling_gancao_tang',
    title: '茯苓甘草汤',
    ref: '73条',
    why: '73条「伤寒，汗出而渴者，五苓散主之；不渴者，茯苓甘草汤主之」——汗出+不渴是抓手，原来只要心下悸+不渴',
    before: [['heart_palp.yes', 'thirsty.no']],
    after: [
      ['heart_palp.yes', 'thirsty.no'],
      ['sweat.yes', 'thirsty.no', 'epigastric_fullness.yes']
    ]
  },
  {
    name: 'tiaowei_chengqi_tang',
    title: '调胃承气汤',
    ref: '70条',
    why: '70条「不恶寒，但热者，实也，当和胃气，与调胃承气汤」——原来的四条路径全都不认这条',
    before: [
      ['delirium.yes', 'cold_drink_desire.yes', 'cold_aversion.no', 'poor_complexion.no']
    ],
    after: [
      ['delirium.yes', 'cold_drink_desire.yes', 'cold_aversion.no', 'poor_complexion.no'],
      ['fever.yes', 'heat_only_no_chill.yes', 'constipation.yes']
    ]
  },
  {
    name: 'zhizi_ganjiang_tang',
    title: '栀子干姜汤',
    ref: '80条',
    why: '80条「身热不去，微烦者」——原来「烦躁+不恶寒」就成立，太松，漏了「身热不去」',
    before: [
      ['restless.yes', 'cold_aversion.no']
    ],
    after: [
      ['restless.yes', 'fever.yes', 'cold_aversion.no']
    ]
  },
  {
    name: 'daqinglong_tang',
    title: '大青龙汤',
    ref: '39条',
    why: '39条「脉浮缓，身不疼，但重，乍有轻时，无少阴证者，大青龙汤发之」——原来只有溢饮一条路认身重，而溢饮要求"疼重"，39条明说"身不疼但重"',
    before: [
      ['no_sweat.yes', 'restless.yes', 'severe_thirst.no'],
      ['no_sweat.yes', 'restless.yes', 'body_pain.yes', 'severe_thirst.no'],
      ['no_sweat.yes', 'restless.yes', 'cold_aversion.yes', 'severe_thirst.no'],
      ['yi_yin.yes']
    ],
    after: [
      ['no_sweat.yes', 'restless.yes', 'severe_thirst.no'],
      ['no_sweat.yes', 'restless.yes', 'body_pain.yes', 'severe_thirst.no'],
      ['no_sweat.yes', 'restless.yes', 'cold_aversion.yes', 'severe_thirst.no'],
      ['yi_yin.yes'],
      // 39 条：身重而不疼、无汗
      ['no_sweat.yes', 'body_heavy.yes', 'body_pain.no']
    ]
  },
  {
    name: 'xiaoqinglong_tang',
    title: '小青龙汤',
    ref: '41条',
    why: '41条「心下有水气，咳而微喘，发热不渴」——原文没有呕、也没说无汗，原来的五条路径一条都不算',
    before: [
      ['vomiting.yes', 'cough.yes'],
      ['vomiting.yes', 'cough.yes', 'thirsty.no'],
      ['cough.yes', 'no_sweat.yes'],
      ['yi_yin.yes'],
      ['saliva_spit.yes', 'epigastric_lump_soft.yes']
    ],
    after: [
      ['vomiting.yes', 'cough.yes'],
      ['vomiting.yes', 'cough.yes', 'thirsty.no'],
      ['cough.yes', 'no_sweat.yes'],
      ['yi_yin.yes'],
      ['saliva_spit.yes', 'epigastric_lump_soft.yes'],
      // 41 条：咳而微喘、不渴
      ['cough.yes', 'chuan.yes', 'thirsty.no']
    ]
  },
  {
    name: 'guizhi_gancao_tang',
    title: '桂枝甘草汤',
    ref: '64条',
    why: '64条「其人叉手自冒心，心下悸，欲得按者」——原来只要「心悸」一条就成立，太松；「欲得按/自冒心」才是它的抓手',
    before: [['heart_palp.yes']],
    after: [
      ['heart_palp.yes', 'desire_to_press_chest.yes']
    ]
  },
  {
    name: 'didang_wan',
    title: '抵当丸',
    ref: '126条',
    why: '126条说的是「少腹满」，不是泛泛的腹满；而且「应小便不利，今反利」是小便自利',
    before: [
      ['abdominal_fullness.yes', 'easy_urination.yes', 'cold_aversion.no', 'poor_complexion.no']
    ],
    after: [
      ['lower_abdominal_lump.yes', 'easy_urination.yes', 'cold_aversion.no', 'poor_complexion.no'],
      ['lower_abdominal_lump.yes', 'easy_urination.yes']
    ]
  },
  {
    name: 'shaoyao_gancao_fuzi_tang',
    title: '芍药甘草附子汤',
    ref: '68条',
    why: '68条「发汗病不解，反恶寒者，虚故也」——本条只有恶寒一个抓手，原来还硬要「四肢拘急」，反而漏掉原文',
    before: [['cold_aversion.yes', 'limb_spasm.yes']],
    after: [
      ['cold_aversion.yes', 'sweat.yes', 'fever.no'],
      ['cold_aversion.yes', 'limb_spasm.yes']
    ]
  }
]

// ---------- 校验 ----------
const errors = []
function checkPath(owner, p) {
  if (!p.length) { errors.push(owner + ' 有空路径'); return }
  for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(owner + ' 引用了不存在的节点 ' + dep)
  }
}
for (const f of NEW) {
  if (registry[f.name]) errors.push('已存在，不能重复建：' + f.name)
  const clash = Object.values(registry).find(d => d.kind === 'formula' && d.title === f.title)
  if (clash) errors.push(f.title + ' 与已有方 ' + clash.name + ' 标题重复')
  for (const p of f.needs) checkPath(f.name, p)
}
for (const f of PATCH) {
  const d = registry[f.name]
  if (!d) { errors.push('找不到要改的方：' + f.name); continue }
  for (const p of f.after) checkPath(f.name, p)
  const now = JSON.stringify(d.needs || [])
  if (now !== JSON.stringify(f.before)) {
    errors.push(f.name + ' 的现状和预期不一致（可能有别的批次改过），先人工核对：\n      实际 ' + now + '\n      预期 ' + JSON.stringify(f.before))
  }
}

console.log('=== 伤寒论逐条过 · 第 2 批（辨太阳病中 97 条）===')
console.log('新建 ' + NEW.length + ' 个方：')
for (const f of NEW) console.log('  ＋ ' + f.title.padEnd(12) + f.name.padEnd(30) + '条 ' + f.refs.join('/'))
console.log('\n修改 ' + PATCH.length + ' 个已有方的 needs：')
for (const f of PATCH) console.log('  ~ ' + f.title.padEnd(12) + f.ref.padEnd(7) + f.why)
if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}

if (!WRITE) {
  console.log('\n（预览，加 --write 落库）')
  process.exit(0)
}

// ---------- 落库 ----------
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
  const res = P.patchPluginSource(text, {
    needs: f.after.map(p => p.map(c => P.condToRef(c)))
  })
  if (!res.changed) { console.log('  （无变化）' + f.name); continue }
  fs.writeFileSync(file, res.text, 'utf8')
  console.log('  ~ ' + f.name + '  [' + res.changedFields.join(',') + ']')
  for (const n of res.notes) console.log('      注：' + n)
}

const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const f of NEW) {
  prov.nodes[f.name] = { source: 'shanghanlun', label: '伤寒论原方', refs: f.refs.slice(), by: 'system:shanghanlun-batch2' }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n已写入 ' + NEW.length + ' 新建 + ' + PATCH.length + ' 修改 + provenance')
