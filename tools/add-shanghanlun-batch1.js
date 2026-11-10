'use strict'
// tools/add-shanghanlun-batch1.js
// ============================================================
// 逐条过伤寒论时发现「条文点了这个方，但库里没有」——这一批把它们补齐。
//
// 判据来自 tools/audit-shanghanlun.js --missing（先跑它，看到的就是这批）。
// 每条 needs 都写明出自第几条、抓手是哪几个字；原文没有的阴性条件不硬凑，
// 但如果原文明确写了「不呕 / 不用水 / 少气」，就一定落进 needs ——
// 那正是最容易丢、也最能分开方的一类信息。
//
// 用法：
//   node tools/add-shanghanlun-batch1.js           预览
//   node tools/add-shanghanlun-batch1.js --write   落库
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

// refs 是宋本条文号，会和 data/texts/伤寒论-条文.json 对得上
const LIST = [
  {
    name: 'guizhi_mahuang_geban_tang',
    title: '桂枝麻黄各半汤',
    refs: ['23'],
    note: '23条：太阳病，得之八九日，如疟状，发热恶寒，热多寒少，其人不呕，清便欲自可，一日二三度发……面色反有热色者，未欲解也，以其不能得小汗出，身必痒，宜桂枝麻黄各半汤。',
    needs: [
      // 抓手是「不能得小汗出，身必痒」＋「如疟状，发热恶寒」
      ['fever.yes', 'cold_aversion.yes', 'sweat.no', 'skin_itch_hives.yes'],
      // 没有身痒时，退一步用「不呕 + 一日二三度发」这个组合
      ['fever.yes', 'cold_aversion.yes', 'no_sweat.yes', 'vomiting.no', 'periodic_chill_fever.yes']
    ],
    contra: [
      '23条：如疟状、发热恶寒、热多寒少，不呕，清便自可，一日二三度发',
      '原文抓手：「不能得小汗出，身必痒」——表郁不解、汗欲出而不得出',
      '桂枝汤与麻黄汤各取三分之一，小发其汗，不可大发',
      '脉微而恶寒者属阴阳俱虚，不可更发汗、更下、更吐，非本方证'
    ]
  },
  {
    name: 'guizhi_er_mahuang_yi_tang',
    title: '桂枝二麻黄一汤',
    refs: ['25'],
    note: '25条：服桂枝汤，大汗出，脉洪大者，与桂枝汤如前法；若形似疟，一日再发者，汗出必解，宜桂枝二麻黄一汤。',
    needs: [
      // 「形似疟，一日再发」＝发作有定时，这正是 periodic_chill_fever
      ['fever.yes', 'cold_aversion.yes', 'periodic_chill_fever.yes', 'sweat.yes']
    ],
    contra: [
      '25条：服桂枝汤大汗出后，形似疟、一日再发者',
      '桂枝汤与麻黄汤按 2:1 配比，比各半汤更偏于解肌',
      '与桂枝麻黄各半汤的区别：本方有汗（已发过汗），各半汤是无汗而身痒'
    ]
  },
  {
    name: 'guizhi_er_yuebi_yi_tang',
    title: '桂枝二越婢一汤',
    refs: ['27'],
    note: '27条：太阳病，发热恶寒，热多寒少，脉微弱者，此无阳也，不可发汗，宜桂枝二越婢一汤。',
    needs: [
      // 表邪未解（发热恶寒）＋里有郁热（口渴而不大渴）＝桂枝汤合越婢汤
      ['fever.yes', 'cold_aversion.yes', 'sweat.yes', 'thirsty.yes', 'severe_thirst.no']
    ],
    contra: [
      '27条：发热恶寒、热多寒少，表邪未解而里有郁热',
      '桂枝汤 2 份 + 越婢汤 1 份，微汗兼清郁热',
      '原文「脉微弱者，此无阳也，不可发汗」——本方是微发其汗，不可当麻黄汤用',
      '⚠ 条文本身症状信息很少（只有发热恶寒、热多寒少），本方判据的可信度低于其它方'
    ]
  },
  {
    name: 'zhizi_gancao_chi_tang',
    title: '栀子甘草豉汤',
    refs: ['76'],
    note: '76条：发汗吐下后，虚烦不得眠，若剧者，必反复颠倒，心中懊憹，栀子豉汤主之；若少气者，栀子甘草豉汤主之；若呕者，栀子生姜豉汤主之。',
    needs: [
      // 栀子豉汤证（虚烦不得眠）＋「少气」
      ['vex_insomnia.yes', 'short_breath.yes', 'cold_aversion.no']
    ],
    contra: [
      '76条：栀子豉汤证兼「少气」者——虚烦不得眠 + 短气不足以息',
      '栀子豉汤加甘草，补中气而缓急',
      '与栀子豉汤的区别只在少气；与栀子生姜豉汤的区别在有呕无呕'
    ]
  },
  {
    name: 'zhizi_shengjiang_chi_tang',
    title: '栀子生姜豉汤',
    refs: ['76'],
    note: '76条：……若呕者，栀子生姜豉汤主之。',
    needs: [
      ['vex_insomnia.yes', 'vomiting.yes', 'cold_aversion.no']
    ],
    contra: [
      '76条：栀子豉汤证兼「呕」者——虚烦不得眠 + 呕吐',
      '栀子豉汤加生姜，降逆止呕',
      '与栀子甘草豉汤的区别：彼为少气，此为呕'
    ]
  },
  {
    name: 'chaihu_jia_mangxiao_tang',
    title: '柴胡加芒硝汤',
    refs: ['104'],
    note: '104条：伤寒十三日不解，胸胁满而呕，日晡所发潮热，已而微利……先宜小柴胡汤以解外，后以柴胡加芒硝汤主之。',
    needs: [
      // 柴胡证（胸胁苦满 + 呕）＋ 潮热（里实）
      ['hypochondriac_fullness.yes', 'vomiting.yes', 'tidal_fever.yes']
    ],
    contra: [
      '104条：胸胁满而呕、日晡所发潮热，误下后微利',
      '小柴胡汤加芒硝，和解兼软坚',
      '原文「先宜小柴胡汤以解外，后以柴胡加芒硝汤」——里实已成才加芒硝',
      '⚠ 原文作「先宜小柴胡汤以解外，后以柴胡加芒硝汤主之」，是一条里的两步治法，不是两个并列方证'
    ]
  },
  {
    name: 'banxia_san_ji_tang',
    title: '半夏散及汤',
    refs: ['313'],
    note: '313条：少阴病，咽中痛，半夏散及汤主之。',
    needs: [
      // 少阴咽痛，偏寒：咽痛而无生疮、无嘶哑，兼有寒象
      ['throat_pain.yes', 'cold_aversion.yes', 'throat_ulcer.no']
    ],
    contra: [
      '313条：少阴病，咽中痛',
      '半夏、桂枝、甘草三味，散寒通阳、涤痰利咽——治的是**寒客少阴**的咽痛',
      '与甘草汤/桔梗汤的区别：那两个偏客热咽痛、无寒象；本方必见恶寒等寒象',
      '与苦酒汤的区别：苦酒汤治咽中生疮、声不出，本方无疮',
      '散、汤两用：不能服散者作汤'
    ]
  },
  {
    name: 'baitong_jia_zhudanzhi_tang',
    title: '白通加猪胆汁汤',
    refs: ['315'],
    note: '315条：少阴病，下利，脉微者，与白通汤。利不止，厥逆无脉，干呕烦者，白通加猪胆汁汤主之。服汤，脉暴出者死，微续者生。',
    needs: [
      // 白通汤证（下利 + 手足厥冷）＋ 干呕 ＋ 烦躁
      ['diarrhea.yes', 'cold_extremities.yes', 'vomiting.yes', 'restless.yes']
    ],
    contra: [
      '315条：少阴病下利，服白通汤后利不止、厥逆无脉、干呕而烦',
      '白通汤加人尿、猪胆汁——咸苦反佐，引阳药入阴，防格拒',
      '原文「服汤，脉暴出者死，微续者生」——脉暴出是阳气外脱，须警惕',
      '⚠ 阴盛格阳重证，非急危重症不用'
    ]
  },
  {
    name: 'mahuang_shengma_tang',
    title: '麻黄升麻汤',
    refs: ['357'],
    note: '357条：伤寒六七日，大下后，寸脉沉而迟，手足厥逆，下部脉不至，喉咽不利，唾脓血，泄利不止者，为难治。麻黄升麻汤主之。',
    needs: [
      // 上热下寒：喉咽不利、唾脓血（上热）＋ 手足厥逆、泄利不止（下寒）
      ['cold_extremities.yes', 'tu_nongxue.yes', 'diarrhea.yes']
    ],
    contra: [
      '357条：大下后，手足厥逆、喉咽不利、唾脓血、泄利不止——上热下寒、虚实夹杂',
      '原文自注「为难治」——这是仲景书里少数明说难治的方证',
      '麻黄升麻汤药味最多（14 味），清上温下、发越郁阳',
      '⚠ 必须在「唾脓血 + 泄利不止 + 手足厥逆」同时出现时才考虑'
    ]
  },
  {
    name: 'lizhong_wan',
    title: '理中丸',
    refs: ['386'],
    note: '386条：霍乱，头痛发热，身疼痛，热多欲饮水者，五苓散主之；寒多不用水者，理中丸主之。',
    needs: [
      // 霍乱吐利 + 「寒多不用水」——不渴是关键抓手
      ['vomiting.yes', 'diarrhea.yes', 'thirsty.no']
    ],
    contra: [
      '386条：霍乱吐利，「寒多不用水者」——不渴是中焦虚寒的抓手',
      '与五苓散的区别就在渴与不渴：热多欲饮水用五苓散，寒多不用水用理中丸',
      '丸、汤两用：腹中未热、益至三四丸；然不及汤，汤法胜丸',
      '人参、干姜、甘草、白术——温中祛寒、补气健脾'
    ]
  },
  {
    name: 'tongmai_sini_jia_zhudanzhi_tang',
    title: '通脉四逆加猪胆汁汤',
    refs: ['390'],
    note: '390条：吐已下断，汗出而厥，四肢拘急不解，脉微欲绝者，通脉四逆加猪胆汁汤主之。',
    needs: [
      // 「吐已下断」＝吐利都停了，剩下汗出、厥逆、四肢拘急——阳亡阴竭
      ['sweat.yes', 'cold_extremities.yes', 'vomiting.no', 'diarrhea.no']
    ],
    contra: [
      '390条：吐已下断（吐利都止了）、汗出而厥、四肢拘急不解、脉微欲绝',
      '通脉四逆汤加猪胆汁，咸苦反佐、引阳入阴',
      '⚠ 「吐已下断」不是病好了，是津液已竭、无物可吐下——比吐利不止更危',
      '与通脉四逆汤的区别：本方用于阴竭阳亡、药入即拒的格拒之势'
    ]
  },
  {
    name: 'shaokun_san',
    title: '烧裈散',
    refs: ['392'],
    note: '392条：伤寒阴阳易之为病，其人身体重，少气，少腹里急，或引阴中拘挛，热上冲胸，头重不欲举，眼中生花，膝胫拘急者，烧裈散主之。',
    needs: [
      // 身重 + 少腹里急 + 热上冲胸
      ['body_heavy.yes', 'lower_abdomen_cramp.yes', 'qi_surge.yes']
    ],
    contra: [
      '392条：阴阳易——身体重、少气、少腹里急、或引阴中拘挛、热上冲胸、头重不欲举、眼中生花、膝胫拘急',
      '「阴阳易」指大病初愈或房事后出现的一组证候，古今认识分歧很大',
      '⚠ 方为「烧裈散」（取妇人中裈近隐处烧灰），属古代治法，现代不主张使用；此处收录是为了条文完整'
    ]
  },
  {
    name: 'muli_zexie_san',
    title: '牡蛎泽泻散',
    refs: ['395'],
    note: '395条：大病差后，从腰以下有水气者，牡蛎泽泻散主之。',
    needs: [
      // 原文只有「腰以下有水气」一个抓手：按之凹陷的水肿
      ['pitting_edema.yes', 'fever.no']
    ],
    contra: [
      '395条：大病差后，从腰以下有水气者',
      '牡蛎、泽泻、蜀漆、葶苈子、商陆根、海藻、栝蒌根——逐水消肿、软坚散结',
      '⚠ 原文只有「腰以下有水气」一个抓手，判据本身很窄；「大病差后」这个病程条件库里没有对应节点',
      '商陆、蜀漆药力峻猛，体虚者慎用'
    ]
  },
  {
    name: 'zhuye_shigao_tang',
    title: '竹叶石膏汤',
    refs: ['397'],
    note: '397条：伤寒解后，虚羸少气，气逆欲吐，竹叶石膏汤主之。',
    needs: [
      // 虚羸（消瘦）+ 少气（短气）+ 气逆欲吐（恶心）
      ['short_breath.yes', 'nausea.yes', 'weight_loss.yes']
    ],
    contra: [
      '397条：伤寒解后，虚羸少气，气逆欲吐',
      '竹叶、石膏、半夏、麦冬、人参、甘草、粳米——清热生津、益气和胃',
      '与白虎加人参汤的区别：本方是热病**解后**余热未尽、气津两伤，不是热盛当下',
      '原文「虚羸少气」是必见之证，无消瘦短气者不必用'
    ]
  }
]

// ---------- 校验 ----------
const errors = []
const warnings = []
const seen = new Set()
for (const f of LIST) {
  if (seen.has(f.name)) errors.push('重名：' + f.name)
  seen.add(f.name)
  if (registry[f.name]) errors.push(f.name + ' 已存在，不能重复建')
  else {
    const clash = Object.values(registry).find(d => d.kind === 'formula' && d.title === f.title)
    if (clash) errors.push(f.name + ' 的标题「' + f.title + '」与已有方 ' + clash.name + ' 重名')
  }
  const paths = f.needs || []
  if (!paths.length) { errors.push(f.name + ' 没有 needs'); continue }
  for (const p of paths) {
    if (!p.length) errors.push(f.name + ' 有空路径（会变成永真）')
    for (const c of p) {
      const dep = String(c).split('.')[0]
      if (!registry[dep]) errors.push(f.name + ' 引用了不存在的节点 ' + dep)
    }
  }
  if (!f.contra || !f.contra.length) warnings.push(f.name + ' 没写 contraindications')
}

console.log('=== 伤寒论补方（第 1 批）===')
console.log('待建 ' + LIST.length + ' 个方剂')
for (const f of LIST) console.log('  ＋ ' + f.title.padEnd(14) + f.name.padEnd(34) + '条 ' + f.refs.join('/'))
if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}
if (warnings.length) {
  console.log('\n提示：')
  for (const w of warnings) console.log('  · ' + w)
}

function render(f) {
  return P.generatePluginSource({
    name: f.name,
    title: f.title,
    kind: 'formula',
    forceKind: true,
    // generatePluginSource 收的是 {ref, pol} 对象数组，不是 'a.yes' 字符串
    needs: f.needs.map(p => p.map(c => P.condToRef(c))),
    contraindications: f.contra
  }).replace('  needs:', '  // ' + f.note + '\n  needs:')
}

if (!WRITE) {
  console.log('\n=== 预览（第 1 个）===')
  console.log(render(LIST[0]))
  console.log('（预览，加 --write 落库）')
  process.exit(0)
}

for (const f of LIST) {
  fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
  console.log('  ＋ ' + f.name + '（' + f.title + '）')
}

const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const f of LIST) {
  prov.nodes[f.name] = {
    source: 'shanghanlun',
    label: '伤寒论原方',
    refs: f.refs.slice(),
    by: 'system:shanghanlun-batch1'
  }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n已写入 ' + LIST.length + ' 个方剂 + provenance')
