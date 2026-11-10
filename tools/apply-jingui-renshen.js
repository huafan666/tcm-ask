'use strict'
// tools/apply-jingui-renshen.js
// 金匮批 21：第二十篇 妇人妊娠病脉证并治（20.1 ~ 20.27）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 20.27 是针刺治法条（刺泻劳宫及关元） → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH20 = '金匮要略·妇人妊娠病脉证并治第二十'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'pregnancy',
    title: '怀孕了',
    kind: 'symptom',
    comment: CH20 + '：妇人得平脉，阴脉小弱，其人渴，不能食，无寒热，名妊娠。',
    trigger: ['怀孕了', '妊娠', '有喜了', '怀上了', '孕期', '已经怀孕', '怀孕状态'],
    negate: ['没有怀孕'],
    ask: '是不是怀孕了？'
  },
  {
    name: 'pregnancy_vomit',
    title: '怀孕后吐得厉害',
    kind: 'symptom',
    comment: CH20 + '：妊娠呕吐不止，干姜人参半夏丸主之。',
    trigger: ['怀孕后吐得厉害', '妊娠呕吐不止', '孕期一直吐', '怀孕吐个不停',
      '怀孕后吃不下老吐', '孕吐严重'],
    negate: ['怀孕不吐'],
    ask: '是不是怀孕以后一直吐、吐得停不下来？'
  },
  {
    name: 'vaginal_bleeding',
    title: '阴道下血不止',
    kind: 'symptom',
    comment: CH20 + '：妇人有漏下者，有半产后因续下血都不绝者，有妊娠下血者……漏下不止。',
    trigger: ['阴道下血不止', '漏下', '下面一直出血', '阴道流血不止', '怀孕后出血',
      '月经淋漓不尽', '下血不止'],
    negate: ['没有出血'],
    ask: '是不是阴道一直有血、淋漓不止？'
  },
  {
    name: 'lower_abdomen_cold_fan',
    title: '小肚子像被扇风一样冷',
    kind: 'symptom',
    comment: CH20 + '：妇人怀娠六七月……腹痛恶寒者，少腹如扇，所以然者，子脏开故也。',
    trigger: ['小肚子像被扇风一样冷', '少腹如扇', '小腹一阵阵发凉', '小肚子像有风往里吹',
      '下腹冷得像扇风', '小腹冷飕飕'],
    negate: ['小肚子不冷'],
    ask: '是不是小肚子一阵阵发冷，像有人在旁边扇风一样？'
  },
  {
    name: 'abdominal_cramp_after_birth',
    title: '腹中隐痛不断',
    kind: 'symptom',
    comment: CH20 + '：妇人怀妊，腹中㽲痛，当归芍药散主之。',
    trigger: ['腹中隐痛不断', '腹中㽲痛', '肚子隐隐作痛不停', '小腹绵绵地痛',
      '肚子老是隐隐疼', '腹部持续隐痛'],
    negate: ['肚子不痛'],
    ask: '是不是肚子（小腹）一直绵绵地隐隐作痛？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'e_zu',
    title: '妊娠恶阻',
    kind: 'summary',
    comment: CH20 + '：妇人得平脉……其人渴，不能食，无寒热，名妊娠……妊娠呕吐不止，干姜人参半夏丸主之。',
    needs: [
      // 怀孕 + 呕吐
      ['pregnancy.yes', 'pregnancy_vomit.yes'],
      ['pregnancy.yes', 'vomiting.yes', 'low_appetite.yes'],
      ['pregnancy.yes', 'vomiting.yes']
    ],
    contraindications: [
      '妊娠恶阻就是**怀孕后恶心呕吐、吃不下饭**，也就是常说的「孕吐」',
      '原文叫「恶阻」，认为病机是胃气上逆、脾胃虚弱',
      '轻的一般在怀孕 6 周左右出现、3 个月后自行缓解；轻证的思路是调和胃气（桂枝汤）',
      '重的「呕吐不止」用干姜人参半夏丸——**温中补虚、降逆止呕**（有干姜、人参护正）',
      '⚠ 妊娠期用药须极为谨慎，尤其活血、攻下、有毒之品一律禁用；' +
      '剧烈呕吐无法进食、脱水、酮体的要住院补液（妊娠剧吐）'
    ],
    ref: CH20 + ' · 娠妊呕吐不止，干姜人参半夏丸主之'
  },
  {
    name: 'bao_zu',
    title: '胞阻',
    kind: 'summary',
    comment: CH20 + '：师曰：妇人有漏下者，有半产后因续下血都不绝者，有妊娠下血者，假令妊娠腹中痛，为胞阻，胶艾汤主之。',
    needs: [
      // 妊娠 + 腹痛 + 下血 —— 原文的定义
      ['pregnancy.yes', 'abdominal_cramp_after_birth.yes', 'vaginal_bleeding.yes'],
      ['pregnancy.yes', 'abdominal_pain.yes', 'vaginal_bleeding.yes'],
      ['pregnancy.yes', 'abdominal_pain.yes']
    ],
    contraindications: [
      '胞阻是妊娠期间**腹中痛 + 下血**，病机是冲任虚寒、阴血不能养胎、气血阻滞（「胞」指胞宫）',
      '原文把三种下血并列：平常的漏下、半产后持续下血、妊娠下血；' +
      '只有「妊娠腹中痛 + 下血」才叫胞阻',
      '主方胶艾汤（芎归胶艾汤）：阿胶、艾叶养血温经止血，配四物汤养血，甘草缓和',
      '⚠ **妊娠期阴道出血伴腹痛是危险信号**，要先排除流产、宫外孕、胎盘问题，必须及时就医做超声'
    ],
    ref: CH20 + ' · 假令妊娠腹中痛，为胞阻，胶艾汤主之'
  },
  {
    name: 'lou_xia',
    title: '漏下',
    kind: 'summary',
    comment: CH20 + '：妇人宿有症病，经断未及三月，而得漏下不止，胎动在脐上者，为症痼害……所以血不止者，其症不去故也。',
    needs: [
      // 下血不止 + 有固定包块（症痼）
      ['vaginal_bleeding.yes', 'fixed_mass.yes'],
      ['vaginal_bleeding.yes', 'lower_abdomen_cramp.yes'],
      ['vaginal_bleeding.yes']
    ],
    contraindications: [
      '漏下指**阴道出血淋漓不断**，原文分几种情况：平素漏下、半产（流产）后持续下血、妊娠下血',
      '如果素有「症病」（腹中固定的包块），停经不到三个月又漏下不止，那是**症痼害**——' +
      '不是怀孕失血，而是瘀积在作怪，瘀不去则血不止',
      '治法是「**当下其症**」——用桂枝茯苓丸化瘀消症，瘀去了血自然止',
      '原文还有胎与症的鉴别：停经后又有血，要看是「胎」还是「衃」（瘀血）',
      '⚠ 阴道异常出血要排除宫颈病变、子宫内膜病变、先兆流产，必须做妇科检查和超声'
    ],
    ref: CH20 + ' · 所以血不止者，其症不去故也'
  }
]

// ---------- 方剂 9 个新建 ----------
const FORMULAS = [
  {
    name: 'guizhi_fuling_wan',
    title: '桂枝茯苓丸',
    kind: 'formula',
    comment: CH20 + '：妇人宿有症病，经断未及三月，而得漏下不止……所以血不止者，其症不去故也，当下其症，桂枝茯苓丸主之。',
    needs: [
      // 漏下 + 固定包块（症痼）
      ['vaginal_bleeding.yes', 'fixed_mass.yes'],
      ['lou_xia.yes', 'fixed_mass.yes'],
      ['vaginal_bleeding.yes', 'lower_abdomen_cramp.yes']
    ],
    contraindications: [
      '治「症痼害」：瘀血结成的固定包块导致漏下不止——瘀不去则血不止，所以要**化瘀消症**',
      '五味等分：桂枝、茯苓、牡丹皮、桃仁、芍药——活血化瘀、缓消症块',
      '做成蜜丸小量服，「每日食前服一丸，不知，加至三丸」——**缓消渐磨，不猛攻**',
      '原文方后注有重要一句：「**妊娠六月动者……当以附子汤温其脏**」之外的辨别，说明妊娠期用它必须极为审慎',
      '⚠ 本方活血力强，**孕妇须在医师指导下使用**，不可自行服用；有出血倾向者忌用'
    ],
    ref: CH20 + ' · 桂枝茯苓丸方（桂枝、茯苓、牡丹去心、桃仁去皮尖熬、芍药各等分，炼蜜丸如兔屎大）'
  },
  {
    name: 'fuzi_tang_furen',
    title: '附子汤（妊娠）',
    kind: 'formula',
    comment: CH20 + '：妇人怀娠六七月，脉弦发热，其胎愈胀，腹痛恶寒者，少腹如扇，所以然者，子脏开故也，当以附子汤温其脏。',
    needs: [
      // 妊娠 + 小腹像扇风一样冷 + 腹痛
      ['pregnancy.yes', 'lower_abdomen_cold_fan.yes'],
      ['pregnancy.yes', 'abdominal_pain.yes', 'cold_aversion.yes']
    ],
    contraindications: [
      '治妊娠六七月而**小腹冷得像扇风一样**（原文：少腹如扇）、腹痛恶寒的情况',
      '病机是「子脏开」——胞宫虚寒、门户不固，所以要用附子汤温脏',
      '⚠ **附子有毒，且为妊娠慎用药**。原文用它，是因为「子脏开」属虚寒重证，' +
      '必须严格遵医嘱，不可自行照方抓药',
      '本条历来有争议：有注家认为此「附子汤」非《伤寒论》的附子汤，方药已不可考'
    ],
    ref: CH20 + ' · 少腹如扇，所以然者，子脏开故也，当以附子汤温其脏'
  },
  {
    name: 'jiaoai_tang',
    title: '胶艾汤（芎归胶艾汤）',
    kind: 'formula',
    comment: CH20 + '：假令妊娠腹中痛，为胞阻，胶艾汤主之。',
    needs: [['bao_zu.yes']],
    contraindications: [
      '治胞阻：妊娠腹中痛 + 下血',
      '七味：川芎、阿胶、甘草、艾叶、当归、芍药、干地黄——即四物汤加阿胶、艾叶、甘草',
      '阿胶养血止血、艾叶温经止血，是「养血温经安胎」的祖方，后世治崩漏胎漏多从此化出',
      '原文用法：「以水五升，清酒三升，合煮取三升，去滓，内胶令消尽，温服一升，日三服，不差更作」——' +
      '用清酒同煮助药力',
      '⚠ 妊娠出血必须就医排查原因，不可只靠中药保胎'
    ],
    ref: CH20 + ' · 芎归胶艾汤方（芎穷、阿胶、甘草各二两，艾叶、当归各三两，芍药四两，干地黄）'
  },
  {
    name: 'danggui_shaoyao_san',
    title: '当归芍药散',
    kind: 'formula',
    comment: CH20 + '：妇人怀妊，腹中㽲痛，当归芍药散主之。',
    needs: [
      // 妊娠 + 腹中绵绵隐痛
      ['pregnancy.yes', 'abdominal_cramp_after_birth.yes'],
      ['abdominal_cramp_after_birth.yes', 'urination_difficulty.yes'],
      ['pregnancy.yes', 'abdominal_pain.yes']
    ],
    contraindications: [
      '治妊娠腹中「㽲痛」——绵绵不休的隐痛，病机是肝脾不和、血虚湿滞',
      '六味：当归、芍药（重用一斤）、川芎养血柔肝；茯苓、白术、泽泻健脾利湿',
      '**养血与利湿并施**——这是本方的特点：既补血又除湿，因为妊娠期常见血虚兼水湿',
      '做成散剂「取方寸匕，酒和，日三服」',
      '后世也用于痛经、月经不调、更年期水肿等属肝脾不和者，是妇科名方'
    ],
    ref: CH20 + ' · 当归芍药散方（当归三两、芍药一斤、茯苓四两、白术四两、泽泻半斤、芎藭半斤）'
  },
  {
    name: 'ganjiang_renshen_banxia_wan',
    title: '干姜人参半夏丸',
    kind: 'formula',
    comment: CH20 + '：妊娠呕吐不止，干姜人参半夏丸主之。',
    needs: [
      // 妊娠 + 呕吐不止 + 偏虚寒
      ['pregnancy.yes', 'pregnancy_vomit.yes'],
      ['pregnancy_vomit.yes', 'cold_aversion.yes']
    ],
    contraindications: [
      '治妊娠呕吐不止而偏**脾胃虚寒**者',
      '三味：干姜（温中）、人参（补虚）、半夏（降逆止呕），「姜汁糊丸」',
      '用时以「生姜汁糊丸，如梧桐子大，饮服十丸，日三服」',
      '⚠ 半夏是妊娠慎用药（传统认为有堕胎之弊），但原文用了它，取「有故无殒」之义。' +
      '**必须由医师决定，不可自行服用**',
      '⚠ 妊娠剧吐（无法进食、脱水、尿酮体阳性）须住院补液，不能只靠口服药'
    ],
    ref: CH20 + ' · 干姜人参半夏丸方（干姜、人参各一两，半夏二两，生姜汁糊丸）'
  },
  {
    name: 'danggui_beimu_kushen_wan',
    title: '当归贝母苦参丸',
    kind: 'formula',
    comment: CH20 + '：妊娠，小便难，饮食如故，当归贝母苦参丸主之。',
    needs: [
      // 妊娠 + 小便难 + 饮食正常（病不在中焦）
      ['pregnancy.yes', 'urination_difficulty.yes', 'low_appetite.no'],
      ['pregnancy.yes', 'urination_difficulty.yes']
    ],
    contraindications: [
      '治妊娠小便困难。原文特意强调「**饮食如故**」——能吃能喝，说明病不在中焦脾胃，而在下焦膀胱',
      '三味：当归（养血润燥）、贝母（宣肺利气、开上以通下）、苦参（清利下焦湿热）',
      '「开上窍以通下窍」：肺为水之上源，贝母宣肺则水道自通',
      '做成蜜丸「如小豆大，饮服三丸，加至十丸」',
      '⚠ 妊娠期尿路问题也要查尿常规，排除感染'
    ],
    ref: CH20 + ' · 当归贝母苦参丸方（当归、贝母、苦参各四两，蜜丸如小豆大）'
  },
  {
    name: 'kuizi_fuling_san',
    title: '葵子茯苓散',
    kind: 'formula',
    comment: CH20 + '：妊娠有水气，身重，小便不利，洒淅恶寒，起即头眩，葵子茯苓散主之。',
    needs: [
      // 妊娠 + 身重 + 小便不利
      ['pregnancy.yes', 'body_heavy.yes', 'urination_difficulty.yes'],
      ['pregnancy.yes', 'pitting_edema.yes', 'dizziness.yes']
    ],
    contraindications: [
      '治妊娠水气：身体沉重、小便不利、一阵阵怕冷、一起来就头晕',
      '只有两味：葵子（冬葵子，滑利通小便）、茯苓（利水健脾），「杵为散，饮服方寸匕，日三服」',
      '原文说「小便利则愈」——小便一通，水湿有出路就好了',
      '病机是妊娠期水湿内停、气化不利',
      '⚠ 妊娠水肿伴高血压、蛋白尿要警惕**妊娠期高血压疾病**，必须产科就诊'
    ],
    ref: CH20 + ' · 葵子茯苓散方（葵子一斤、茯苓三两，杵为散，饮服方寸匕，日三服）'
  },
  {
    name: 'danggui_san',
    title: '当归散',
    kind: 'formula',
    comment: CH20 + '：妇人妊娠，宜常服当归散主之。',
    needs: [
      // 妊娠 + 需要养胎调理（偏血虚有热）
      ['pregnancy.yes', 'restless.yes'],
      ['pregnancy.yes', 'low_energy.yes'],
      ['pregnancy.yes']
    ],
    contraindications: [
      '妊娠「常服」的养胎方，偏**血虚而有热**者',
      '五味：当归、黄芩、芍药、川芎各一两，白术半斤（白术用量最大）——养血、清热、健脾安胎',
      '原文说「妊娠常服即易产，胎无疾苦，产后百病悉主之」——古人把它当保健方用',
      '⚠ 现代观点：**不主张无症状的孕妇长期服药**。「常服」应按个体辨证，不可理解为人人该吃',
      '黄芩、白术是后世「安胎圣药」的组合，出自此方'
    ],
    ref: CH20 + ' · 当归散方（当归、黄芩、芍药、芎藭各一两，白术半斤）'
  },
  {
    name: 'baizhu_san',
    title: '白术散',
    kind: 'formula',
    comment: CH20 + '：妊娠养胎，白术散主之。',
    needs: [
      // 妊娠养胎，偏脾虚寒湿
      ['pregnancy.yes', 'cold_aversion.yes'],
      ['pregnancy.yes', 'low_appetite.yes'],
      ['pregnancy.yes', 'abdominal_cramp_after_birth.yes']
    ],
    contraindications: [
      '妊娠养胎方，偏**脾虚寒湿**者',
      '四味：白术、川芎、蜀椒（去汗）、牡蛎——健脾、温中、安胎',
      '原文「但苦痛，加芍药；心下毒痛，倍加芎藭；心烦吐痛不能食饮，加细辛一两、半夏大者二十枚」——' +
      '有随症加减法',
      '和当归散的区别：当归散偏血虚有热，白术散偏脾虚寒湿（蜀椒温中）',
      '⚠ 蜀椒辛热，阴虚有热者不宜；同样**不建议无症状孕妇长期服用**'
    ],
    ref: CH20 + ' · 白术散方（白术、芎穷、蜀椒三分去汗、牡蛎）'
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
const willExist = new Set(
  NEW_SYMPTOMS.map(s => s.name)
    .concat(SUMMARIES.map(s => s.name))
    .concat(FORMULAS.map(f => f.name))
)
for (const f of SUMMARIES.concat(FORMULAS)) {
  for (const p1 of (f.needs || [])) for (const c of p1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !willExist.has(dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

console.log('=== 触发词查重（完全相同才报）===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      for (const other of kwsOf(registry[name])) {
        if (other === kw) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处' : '  没有完全相同的关键词 ✓')

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

function appendPath(id, newPaths, note) {
  let f = null
  for (const d of ['formulas', 'syndromes']) {
    const p = path.join(PLUGINS, d, id + '.js')
    if (fs.existsSync(p)) { f = p; break }
  }
  if (!f) return '   ⚠ 找不到 ' + id
  let src = fs.readFileSync(f, 'utf8')
  const flat = /needs:\s*\[((?:\s*'[^']*'\s*,?)+)\]\s*,/.exec(src)
  if (flat && !flat[1].includes('[')) {
    const items = [...flat[1].matchAll(/'([^']*)'/g)].map(x => "'" + x[1] + "'")
    src = src.replace(flat[0], 'needs: [\n    [' + items.join(', ') + ']\n  ],')
  }
  const todo = newPaths.filter(p => {
    const sig = p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
    for (const line of src.split('\n')) {
      if (!line.includes('[')) continue
      const names = [...line.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)].map(x => x[1]).sort().join('+')
      if (names === sig) return false
    }
    return true
  })
  if (!todo.length) { fs.writeFileSync(f, src, 'utf8'); return '   = ' + id + ' 已有所需路径' }
  const lines = todo.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
  let out = src.replace(/(\n\s*\],\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\]\n\s*\})/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) { fs.writeFileSync(f, src, 'utf8'); return '   ⚠ ' + id + ' 没找到插入点' }
  fs.writeFileSync(f, out, 'utf8')
  return '   ＋ ' + id + ' 追加 ' + todo.length + ' 条路径'
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

  console.log('\n=== 既有方剂追加路径 ===')
  console.log(appendPath('guizhi_tang',
    [['pregnancy.yes', 'vomiting.yes', 'low_appetite.yes']],
    '    // 金匮 20.1：妇人得平脉……其人渴，不能食，无寒热，名妊娠，桂枝汤主之'))

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + NEW_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂')
} else {
  for (const s of NEW_SYMPTOMS) console.log('\n症状 ' + s.name + '（' + s.title + '）｜' + s.ask)
  for (const s of SUMMARIES) {
    console.log('\n证候 ' + s.name + '（' + s.title + '）')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n方剂：')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(22) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
