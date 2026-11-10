'use strict'
// tools/apply-jingui-nue.js
// 金匮批 6：第四篇 疟病脉证并治（金匮 4.1 ~ 4.5）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 4.1 是纯脉象/治则总纲（弦数多热、弦迟多寒、可下可温可汗可吐……）→ 不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH4 = '金匮要略·疟病脉证并治第四'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'periodic_chill_fever',
    title: '定时发冷发热',
    kind: 'symptom',
    // 疟疾的命门：发作有固定时间（一日一发、间日一发、三日一发），
    // 和少阳「往来寒热」（无定时）是两回事，必须分开建节点
    comment: CH4 + '：病疟以月，一日发……（疟疾发作有定时）',
    trigger: ['定时发冷发热', '每天定时发冷发热', '隔一天发冷发热', '隔天发作一次', '按时发冷发热',
      '固定时间发冷发热', '周期性发冷发热', '打摆子', '定时打摆子', '到点就发冷发热',
      '每隔一天犯一次', '隔两三天犯一次'],
    negate: ['不发冷了', '已经不发作了'],
    ask: '是不是发冷发热有固定规律，比如每天、隔一天或者隔两三天就准点发作一次？'
  },
  {
    name: 'heat_only_no_chill',
    title: '只发热不发冷',
    kind: 'symptom',
    comment: CH4 + '：身无寒但热（温疟）；但热不寒者，邪气内藏于心（瘅疟）。',
    trigger: ['只发热不发冷', '光发热不发冷', '只有热没有冷', '但热不寒', '一点不觉得冷只发热',
      '发烧但不发冷', '只烧不冷'],
    negate: ['既发热又发冷', '发热也发冷'],
    ask: '是不是只有发热，一点也不觉得冷？'
  },
  {
    name: 'chill_predominant',
    title: '冷多热少',
    kind: 'symptom',
    comment: CH4 + '：疟多寒者，名曰牝疟。',
    trigger: ['冷多热少', '发冷多发热少', '怕冷多发热少', '寒多热少', '冷的时候长热的时候短',
      '以发冷为主', '主要是发冷'],
    negate: ['热多冷少'],
    ask: '是不是发冷的时候多、发热的时候少，冷得比较明显？'
  },
  {
    name: 'hand_foot_hot',
    title: '手脚心发烫',
    kind: 'symptom',
    comment: CH4 + '：手足热而欲呕（瘅疟）。',
    trigger: ['手脚心发烫', '手脚发热', '手心脚心发热', '手足热', '手心发烫', '脚心发烫',
      '手脚心烧得慌', '手心脚心烫'],
    negate: ['手脚不热', '手脚发凉'],
    ask: '是不是手心脚心发烫，摸着比别处热？'
  },
  {
    name: 'hypochondriac_mass',
    title: '胁下有硬块',
    kind: 'symptom',
    comment: CH4 + '：此结为症瘕，名曰疟母（疟久不愈，胁下结成痞块）。',
    // 注意与 lower_abdominal_lump（少腹硬块）区分：这里是两胁/肋骨下的块
    trigger: ['胁下有硬块', '胁下摸到块', '肋骨下面有硬块', '胁下有痞块', '胁下有个包块',
      '左边肋骨下有块', '两胁有硬块', '胁下结块'],
    negate: ['胁下没有硬块'],
    ask: '是不是两侧肋骨下面（胁下）能摸到硬块、按着有点顶手？'
  },
  {
    name: 'weight_loss',
    title: '明显消瘦',
    kind: 'symptom',
    comment: CH4 + '：令人消铄脱肉（瘅疟日久，肌肉消瘦）。',
    trigger: ['明显消瘦', '瘦了很多', '掉秤厉害', '体重下降很多', '肉都掉了', '瘦得厉害',
      '越来越瘦', '脱肉'],
    negate: ['体重没变', '没瘦'],
    ask: '是不是这阵子瘦得明显，体重掉了很多？'
  }
]

// ---------- 证候 4 个 ----------
const SUMMARIES = [
  {
    name: 'dan_nue',
    title: '瘅疟',
    kind: 'summary',
    comment: CH4 + '：阴气孤绝，阳气独发，则热而少气烦冤，手足热而欲呕，名曰瘅疟，若但热不寒者……令人消铄脱肉。',
    needs: [
      // 但热不寒 + 手足热
      ['heat_only_no_chill.yes', 'hand_foot_hot.yes'],
      // 但热不寒 + 日渐消瘦
      ['heat_only_no_chill.yes', 'weight_loss.yes']
    ],
    contraindications: [
      '瘅疟的特点是「但热不寒」——只发热、完全不发冷（原文叫阳气独发、阴气孤绝）',
      '热得厉害还伴气短、心里烦闷委屈（少气烦冤），手脚心发烫，恶心想吐',
      '日子久了会明显消瘦（原文：令人消铄脱肉），因为热在消耗肌肉',
      '和温疟的区别：温疟还带着骨节疼烦、时呕（表证未尽）；瘅疟是里热独盛、已经伤到阴',
      '本条只出证候，原文没有给方'
    ],
    ref: CH4 + ' · 阴气孤绝，阳气独发……名曰瘅疟'
  },
  {
    name: 'wen_nue',
    title: '温疟',
    kind: 'summary',
    comment: CH4 + '：温疟者，其脉如平，身无寒但热，骨节疼烦，时呕，白虎加桂枝汤主之。',
    needs: [
      ['heat_only_no_chill.yes', 'joint_pain_rigid.yes'],
      ['heat_only_no_chill.yes', 'vomiting.yes', 'joint_pain_rigid.yes']
    ],
    contraindications: [
      '温疟是「身无寒但热」——只发热不发冷，同时骨节疼、烦得厉害，时不时还想呕',
      '和瘅疟的区别：温疟还带着骨节疼烦（邪在表、没完全入里）；瘅疟是纯粹的里热伤阴',
      '脉象原文说「其脉如平」（看不出明显异常），所以脉不是鉴别点'
    ],
    ref: CH4 + ' · 温疟者，其脉如平，身无寒但热，骨节疼烦，时呕'
  },
  {
    name: 'pin_nue',
    title: '牝疟',
    kind: 'summary',
    comment: CH4 + '：疟多寒者，名曰牝疟，蜀漆散主之。',
    needs: [
      ['periodic_chill_fever.yes', 'chill_predominant.yes']
    ],
    contraindications: [
      '牝疟就是「疟多寒」——发作时以发冷为主、发热很少，甚至只冷不热',
      '「牝」是雌性的意思，古人用雌（阴）来形容这种偏寒的类型；偏热的叫「牡疟」',
      '病机是阳气被痰湿蔽阻，出不来，所以寒多'
    ],
    ref: CH4 + ' · 疟多寒者，名曰牝疟'
  },
  {
    name: 'nue_mu',
    title: '疟母',
    kind: 'summary',
    comment: CH4 + '：病疟以月，一日发……设不差，当月尽解；如其不差……此结为症瘕，名曰疟母，急治之，宜鳖甲煎丸。',
    needs: [
      ['periodic_chill_fever.yes', 'hypochondriac_mass.yes']
    ],
    contraindications: [
      '疟母是疟疾拖久了没好，邪气结成块，堵在胁下——原文说「此结为症瘕，名曰疟母」',
      '摸得到硬块、按着顶手，是瘀血痰浊互结成的「块」，不是单纯的寒热发作',
      '原文特意说「急治之」——这种块要尽早化掉，拖久了更难消',
      '现代可见于疟疾反复发作后的脾肿大'
    ],
    ref: CH4 + ' · 此结为症瘕，名曰疟母，急治之'
  }
]

// ---------- 方剂 3 个 ----------
const FORMULAS = [
  {
    name: 'biejia_jian_wan',
    title: '鳖甲煎丸',
    kind: 'formula',
    comment: CH4 + '：此结为症瘕，名曰疟母，急治之，宜鳖甲煎丸。',
    needs: [['nue_mu.yes']],
    contraindications: [
      '专治疟母（疟疾日久、胁下结成硬块）',
      '鳖甲软坚散结为主，配大黄、桃仁、䗪虫、蜣螂、鼠妇等破血逐瘀，又用人参、阿胶护正气',
      '这是攻补兼施的缓消之方，做成小丸「空心服七丸，日三服」，不宜猛攻',
      '孕妇忌用（方中破血药多）'
    ],
    ref: CH4 + ' · 鳖甲煎丸方（二十三味，为末，取锻灶下灰、清酒浸灰，煮鳖甲如胶漆，绞汁和药为丸）'
  },
  {
    name: 'baihu_jia_guizhi_tang',
    title: '白虎加桂枝汤',
    kind: 'formula',
    comment: CH4 + '：温疟者……身无寒但热，骨节疼烦，时呕，白虎加桂枝汤主之。',
    needs: [['wen_nue.yes']],
    contraindications: [
      '专治温疟：只发热不发冷、骨节疼烦、时不时想呕',
      '白虎汤清里热（知母、石膏、甘草、粳米），加桂枝一味兼解表、通骨节',
      '原文说服后「汗出愈」——出点汗热就退了',
      '注意与白虎加人参汤区别：那是汗多、大渴、背微恶寒的阳明热盛气津两伤，没有骨节疼烦'
    ],
    ref: CH4 + ' · 白虎加桂枝汤方（知母六两、甘草炙二两、石膏一斤、粳米二合、桂枝三两）'
  },
  {
    name: 'shuqi_san',
    title: '蜀漆散',
    kind: 'formula',
    comment: CH4 + '：疟多寒者，名曰牝疟，蜀漆散主之。',
    needs: [['pin_nue.yes']],
    contraindications: [
      '专治牝疟（发作时以冷为主、热很少）',
      '蜀漆（常山的嫩枝叶）是截疟的主药，配云母、龙骨安神镇逆',
      '服法很讲究：在发作之前用浆水送服；温疟要加蜀漆半分，临发作时服',
      '蜀漆有催吐作用，用量要谨慎；孕妇忌用'
    ],
    ref: CH4 + ' · 蜀漆散方（蜀漆洗去腥、云母烧二日夜、龙骨等分，杵为散）'
  }
]

// ---------- 校验 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

function kwsOf(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}

const errors = []
for (const s of NEW_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const f of SUMMARIES.concat(FORMULAS)) if (registry[f.name]) errors.push(f.name + ' 已存在')
const willExist = new Set(NEW_SYMPTOMS.map(s => s.name).concat(SUMMARIES.map(s => s.name)))
for (const f of SUMMARIES.concat(FORMULAS)) {
  for (const p1 of (f.needs || [])) for (const c of p1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !willExist.has(dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

// 触发词查重（只报完全相同的，便于人工判断）
console.log('=== 触发词查重 ===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      for (const other of kwsOf(registry[name])) {
        if (other === kw) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name + ' 完全相同'); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处' : '  没有完全相同的关键词 ✓')

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 症状 ' + s.name + '（' + s.title + '）')
  }
  for (const f of SUMMARIES) {
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 证候 ' + f.name + '（' + f.title + '）')
  }
  for (const f of FORMULAS) {
    fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 方剂 ' + f.name + '（' + f.title + '）')
  }
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：6 症状 + 4 证候 + 3 方剂 + provenance')
} else {
  for (const x of NEW_SYMPTOMS) { console.log('\n=== 症状 ' + x.name + '（' + x.title + '）==='); console.log('问：' + x.ask) }
  for (const s of SUMMARIES) {
    console.log('\n=== 证候 ' + s.name + '（' + s.title + '）===')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n=== 方剂 ===')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(16) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
