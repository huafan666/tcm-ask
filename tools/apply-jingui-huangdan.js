'use strict'
// tools/apply-jingui-huangdan.js
// 金匮批 17：第十五篇 黄疸病脉证并治（15.1 ~ 15.25）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 15.1/15.2/15.3/15.8/15.9/15.11/15.12 以脉象立论或属预后断语 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH15 = '金匮要略·黄疸病脉证并治第十五'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'black_stool',
    title: '大便发黑',
    kind: 'symptom',
    comment: CH15 + '：酒疸下之，久久为黑疸……大便正黑；女劳之病……大便必黑。',
    trigger: ['大便发黑', '大便是黑的', '大便正黑', '便黑如柏油', '大便颜色发黑',
      '黑便', '大便黑褐色'],
    negate: ['大便颜色正常'],
    ask: '是不是大便颜色发黑，像柏油一样？'
  },
  {
    name: 'forehead_dark',
    title: '额头发黑',
    kind: 'symptom',
    comment: CH15 + '：黄家日晡所发热，而反恶寒，此为女劳得之……额上黑。',
    trigger: ['额头发黑', '额上黑', '脑门发黑', '额头颜色发暗发黑', '额头黑一块'],
    negate: ['额头颜色正常'],
    ask: '是不是额头发黑、颜色发暗？'
  },
  {
    name: 'nose_dry',
    title: '鼻子发干',
    kind: 'symptom',
    comment: CH15 + '：酒黄疸者……腹满欲吐，鼻燥。',
    trigger: ['鼻子发干', '鼻燥', '鼻子干得难受', '鼻腔干燥', '鼻子干得发痒'],
    negate: ['鼻子不干'],
    ask: '是不是鼻子发干、鼻腔里燥得难受？'
  },
  {
    name: 'heart_hot',
    title: '心里发热',
    kind: 'symptom',
    comment: CH15 + '：夫病酒黄疸，必小便不利，其候心中热，足下热，是其证也。',
    trigger: ['心里发热', '心中热', '心里热烘烘的', '心里火烧火燎', '心口里面发热'],
    negate: ['心里不热'],
    ask: '是不是心里（胸口里面）觉得发热、热烘烘的？'
  },
  {
    name: 'hiccup',
    title: '打嗝不止（哕）',
    kind: 'symptom',
    comment: CH15 + '：黄疸病……不可除热，热除必哕。哕者，小半夏汤主之。',
    trigger: ['打嗝不止', '呃逆', '哕', '一直打嗝停不下来', '吃完饭就打嗝',
      '打嗝连着打'],
    negate: ['不打嗝'],
    ask: '是不是一直打嗝、停不下来（原文叫「哕」）？'
  }
]

// ---------- 证候 5 个 ----------
const SUMMARIES = [
  {
    name: 'huang_dan',
    title: '黄疸',
    kind: 'summary',
    comment: CH15 + '：然黄家所得，从湿得之。一身尽发热而黄，肚热，热在里，当下之。',
    needs: [
      ['jaundice.yes'],
      // 发黄 + 口渴 + 小便不利
      ['jaundice.yes', 'thirsty.yes', 'urination_difficulty.yes'],
      // 发黄 + 腹满 + 心烦睡不着
      ['jaundice.yes', 'abdominal_fullness.yes', 'vex_insomnia.yes']
    ],
    contraindications: [
      '黄疸的核心是**「黄家所得，从湿得之」**——湿邪是根本，所以在湿不在燥',
      '基本表现：皮肤、眼白发黄，尿黄，可伴发热、腹满、口渴、小便不利',
      '分型：谷疸（饮食所伤）、酒疸（喝酒所致）、女劳疸（房劳所致）、黑疸（久病转归）',
      '治法总纲：「诸病黄家，但利其小便」——利小便祛湿是主法；脉浮有表证的才用汗法',
      '预后判据（15.12）：「疸而渴者难治，疸而不渴者可治」——口渴说明津伤、热重，难治',
      '⚠ 黄疸必须查肝功能、胆红素、腹部超声，分清肝细胞性、梗阻性、溶血性，不能只靠中医辨证'
    ],
    ref: CH15 + ' · 然黄家所得，从湿得之'
  },
  {
    name: 'gu_dan',
    title: '谷疸',
    kind: 'summary',
    comment: CH15 + '：谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸，茵陈蒿汤主之。',
    needs: [
      // 发黄 + 不想吃 + 头晕（食即头眩）
      ['jaundice.yes', 'low_appetite.yes', 'dizziness.yes'],
      // 发黄 + 恶寒发热 + 不想吃
      ['jaundice.yes', 'cold_aversion.yes', 'low_appetite.yes'],
      // 发黄 + 心下不安 + 腹满
      ['jaundice.yes', 'chest_qi_stuffiness.yes', 'abdominal_fullness.yes']
    ],
    contraindications: [
      '谷疸是饮食不节、脾胃受伤、湿热内蕴所致的黄疸',
      '原文三要素：**寒热、不食、食即头眩、心胸不安**——先有恶寒发热、吃不下，一吃就头晕、心下不舒服',
      '「久久发黄」说明不是一两天，湿热积久了才发黄',
      '与酒疸的区别：谷疸是吃出来的，酒疸是喝出来的（饮酒过度）',
      '主方茵陈蒿汤（茵陈、栀子、大黄），清热利湿退黄'
    ],
    ref: CH15 + ' · 谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸'
  },
  {
    name: 'jiu_dan',
    title: '酒疸',
    kind: 'summary',
    comment: CH15 + '：夫病酒黄疸，必小便不利，其候心中热，足下热，是其证也。酒黄疸，心中懊憹或热痛，栀子大黄汤主之。',
    needs: [
      // 发黄 + 心里发热（酒疸最有特点的主观感受）
      ['jaundice.yes', 'heart_hot.yes'],
      // 发黄 + 心里发热 + 足下热 + 小便不利
      ['jaundice.yes', 'heart_hot.yes', 'urination_difficulty.yes'],
      // 发黄 + 心中懊憹（烦闷得翻来覆去）
      ['jaundice.yes', 'vex_insomnia.yes'],
      // 发黄 + 想呕
      ['jaundice.yes', 'heart_hot.yes', 'vomiting.yes']
    ],
    contraindications: [
      '酒疸是饮酒过度、湿热内蕴引起的黄疸',
      '原文的关键描述：**小便不利、心中热、足下热**——心里热、脚心也热，这是酒疸的特点',
      '还有「心中懊憹或热痛」——心里烦闷得坐立不安，甚至热痛',
      '原文另给了治法分岔：「其脉浮者先吐之，沉弦者先下之」——病位偏上先吐、偏下先下',
      '⚠ 原文警告：「酒疸下之，久久为黑疸」——用下法不当会转成更难治的黑疸',
      '要戒酒，不戒酒光吃药没用'
    ],
    ref: CH15 + ' · 夫病酒黄疸，必小便不利，其候心中热，足下热，是其证也'
  },
  {
    name: 'nv_lao_dan',
    title: '女劳疸',
    kind: 'summary',
    comment: CH15 + '：黄家日晡所发热，而反恶寒，此为女劳得之；膀胱急，少腹满、身尽黄，额上黑，足下热，因作黑疸。',
    needs: [
      // 发黄 + 额头发黑 + 黑便 —— 女劳疸最特异的组合
      ['jaundice.yes', 'forehead_dark.yes', 'black_stool.yes'],
      // 午后潮热 + 反而怕冷
      ['jaundice.yes', 'tidal_fever.yes', 'cold_aversion.yes'],
      // 发黄 + 额上黑
      ['jaundice.yes', 'forehead_dark.yes', 'lower_abdomen_cramp.yes']
    ],
    contraindications: [
      '女劳疸是房劳过度、肾精亏损所致的黄疸',
      '原文给的辨证要点很精确：**日晡所发热而反恶寒**（傍晚发热却怕冷）、身尽黄、**额上黑**、足下热、' +
      '膀胱急、少腹满、**大便必黑**、时溏',
      '「额上黑」和「大便必黑」是本证最有辨识度的两点',
      '原文特意说「此女劳之病，非水也」——虽然腹胀如水，但**不是水肿病**，别误当水气治',
      '原文还说「腹满者难治」——出现明显腹满说明病深',
      '主方硝石矾石散，但原文也承认此证难治'
    ],
    ref: CH15 + ' · 黄家日晡所发热，而反恶寒，此为女劳得之……此女劳之病，非水也'
  },
  {
    name: 'hei_dan',
    title: '黑疸',
    kind: 'summary',
    comment: CH15 + '：酒疸下之，久久为黑疸，目青面黑，心中如啖蒜虀状，大便正黑，皮肤爪之不仁。',
    needs: [
      // 面色发黑 + 大便发黑 —— 黑疸命名的由来
      ['face_black.yes', 'black_stool.yes'],
      // 发黄 + 面黑 + 皮肤麻木不仁
      ['jaundice.yes', 'face_black.yes', 'limb_numbness.yes'],
      // 面黑 + 心中懊憹
      ['face_black.yes', 'vex_insomnia.yes']
    ],
    contraindications: [
      '黑疸是黄疸久治不愈、瘀血内停的转归，多由酒疸误下发展而来，所以原文说「酒疸下之，久久为黑疸」',
      '「黑」体现在两处：**目青面黑**（脸色发黑暗）、**大便正黑**',
      '还有「心中如啖蒜虀状」——心里像吃了生蒜一样辛辣不适；「皮肤爪之不仁」——皮肤知觉迟钝',
      '病机是湿热日久、由气分入血分、瘀血内结',
      '⚠ 面色黧黑伴黑便，在现代要高度警惕肝硬化失代偿、消化道出血等，必须及时就医'
    ],
    ref: CH15 + ' · 酒疸下之，久久为黑疸，目青面黑，心中如啖蒜虀状，大便正黑'
  }
]

// ---------- 方剂 6 个新建 ----------
const FORMULAS = [
  {
    name: 'xiaoshi_fanshi_san',
    title: '硝石矾石散',
    kind: 'formula',
    comment: CH15 + '：此为女劳得之……因作黑疸……腹满者难治。硝石矾石散主之。',
    needs: [['nv_lao_dan.yes']],
    contraindications: [
      '治女劳疸（额上黑、大便黑、日晡发热而反恶寒）',
      '只有两味：硝石（即火硝，破坚散结）、矾石（皂矾，除湿退黄），等分为散',
      '原文要求「以大麦粥汁和服」——用大麦粥护胃，因为两味药都比较峻',
      '方后注「病随大小便去，小便正黄，大便正黑，是候也」——大小便排出黄色/黑色物是药效反应',
      '⚠ 硝石、皂矾均非平和之品，须严格遵医嘱，不可久服'
    ],
    ref: CH15 + ' · 硝石矾石散（硝石、矾石等分，为散，以大麦粥汁和服方寸匕，日三服）'
  },
  {
    name: 'zhizi_dahuang_tang',
    title: '栀子大黄汤',
    kind: 'formula',
    comment: CH15 + '：酒黄疸，心中懊憹或热痛，栀子大黄汤主之。',
    needs: [
      // 酒疸 + 心中懊憹（烦闷翻来覆去）
      ['jiu_dan.yes', 'vex_insomnia.yes'],
      ['jiu_dan.yes', 'heart_hot.yes', 'chest_qi_stuffiness.yes']
    ],
    contraindications: [
      '治酒疸：心里烦闷懊憹、甚至热痛',
      '四味：栀子、大黄、枳实、豉——清热除烦、通利湿热',
      '和茵陈蒿汤的区别：茵陈蒿汤以茵陈为君、重在利湿退黄；本方以栀子为君、重在清心除烦，' +
      '适合酒疸热象重、心中懊憹明显者',
      '服法「分温三服」，得下即停'
    ],
    ref: CH15 + ' · 酒黄疸，心中懊憹或热痛，栀子大黄汤主之'
  },
  {
    name: 'zhugao_fajian',
    title: '猪膏发煎',
    kind: 'formula',
    comment: CH15 + '：诸黄，猪膏发煎主之。',
    needs: [
      // 各种黄疸偏燥结者（原文只写「诸黄」，用大便干结承接「燥」的病机）
      ['huang_dan.yes', 'constipation.yes'],
      ['jaundice.yes', 'skin_scaly.yes']
    ],
    contraindications: [
      '治「诸黄」而偏于津枯燥结者——方名就是两味：猪膏（猪油）、乱发（血余）',
      '猪油润燥、乱发（血余）消瘀利水，是「润以通之」的思路，适合干枯燥结的黄疸',
      '原文用法：「猪膏半斤、乱发如鸡子大三枚，和膏中煎之，发消药成，分再服，病从小便出」',
      '偏燥、偏干瘦的黄疸适用；湿热壅盛、大便不通的实证不宜'
    ],
    ref: CH15 + ' · 诸黄，猪膏发煎主之'
  },
  {
    name: 'yinchen_wuling_san',
    title: '茵陈五苓散',
    kind: 'formula',
    comment: CH15 + '：黄疸病，茵陈五苓散主之。',
    needs: [
      // 黄疸 + 小便不利（湿重、以利小便为法）
      ['jaundice.yes', 'urination_difficulty.yes'],
      ['huang_dan.yes', 'urination_difficulty.yes', 'thirsty.yes']
    ],
    contraindications: [
      '治黄疸而湿重于热者：以身黄、小便不利为主，热象不重',
      '五苓散（利水化气）+ 茵陈（利湿退黄），是「利小便以退黄」的典型组合',
      '原文总纲「诸病黄家，但利其小便」——本方正是这条总纲的代表方',
      '和茵陈蒿汤的区别：茵陈蒿汤有大黄、偏湿热俱盛（腹满、大便不通）；本方偏湿重、以小便不利为主',
      '原文是散剂（茵陈蒿末十分、五苓散五分，先食饮服方寸匕，日三服）'
    ],
    ref: CH15 + ' · 黄疸病，茵陈五苓散主之'
  },
  {
    name: 'dahuang_xiaoshi_tang',
    title: '大黄硝石汤',
    kind: 'formula',
    comment: CH15 + '：黄疸腹满，小便不利而赤，自汗出，此为表和里实，当下之，宜大黄硝石汤。',
    needs: [
      // 黄疸 + 腹满 + 小便不利（表和里实）
      ['jaundice.yes', 'abdominal_fullness.yes', 'urination_difficulty.yes'],
      ['jaundice.yes', 'abdominal_fullness.yes', 'sweat.yes']
    ],
    contraindications: [
      '治黄疸的**里实证**：腹满、小便不利而色赤、自汗出',
      '原文的辨证结论很明确：「此为**表和里实**，当下之」——表无病、里有实结，所以要攻下',
      '四味：大黄、硝石、黄柏、栀子——清热通腑、利湿退黄',
      '「自汗出」在这里不是表虚，而是里热蒸腾迫汗外出的表现，不能因为出汗就以为是表证',
      '体虚、孕妇忌用；得下即停'
    ],
    ref: CH15 + ' · 黄疸腹满，小便不利而赤，自汗出，此为表和里实，当下之，宜大黄硝石汤'
  },
  {
    name: 'mahuang_chunjiu_tang',
    title: '麻黄醇酒汤',
    kind: 'formula',
    comment: CH15 + '：《千金》麻黄醇酒汤：治黄疸。麻黄三两。',
    needs: [
      // 黄疸 + 无汗（原文出自《千金》，以发汗为法）
      ['jaundice.yes', 'no_sweat.yes'],
      ['huang_dan.yes', 'no_sweat.yes', 'wind_aversion.yes']
    ],
    contraindications: [
      '出自《千金》方，附于《金匮》黄疸篇末：治黄疸，只有麻黄一味，用醇酒（美酒）煎煮',
      '取「以汗解之」的思路——原文总纲说「假令脉浮，当以汗解之」',
      '酒能助麻黄发散，同时酒本身行气血',
      '⚠ 只适合表闭无汗的黄疸；有汗、体虚、心肝功能不佳者忌用（麻黄发汗峻烈，酒也伤肝）',
      '⚠ 黄疸患者多有肝损伤，饮酒本应避免——本方的酒是煎药溶媒且量小，绝不可自行服用'
    ],
    ref: CH15 + ' · 《千金》麻黄醇酒汤：治黄疸（麻黄三两，以美清酒五升，煮取二升半，顿服尽）'
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
  // 扁平数组简写形式先转成标准路径数组
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
  let out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
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
  console.log(appendPath('yinchenhao_tang',
    [['gu_dan.yes']],
    '    // 金匮 15.13：谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸，茵陈蒿汤主之'))
  console.log(appendPath('guizhi_jia_huangqi_tang',
    [['huang_dan.yes', 'wind_aversion.yes', 'sweat.yes']],
    '    // 金匮 15.16：诸病黄家，但利其小便；假令脉浮，当以汗解之，宜桂枝加黄芪汤主之'))
  console.log(appendPath('xiaobanxia_tang',
    [['hiccup.yes']],
    '    // 金匮 15.20：黄疸病……不可除热，热除必哕。哕者，小半夏汤主之'))
  console.log(appendPath('xiaojianzhong_tang',
    [['jaundice.yes', 'urination_difficulty.no', 'low_energy.yes']],
    '    // 金匮 15.22：男子黄，小便自利，当与虚劳小建中汤'))
  console.log(appendPath('dachaihu_tang',
    [['jaundice.yes', 'abdominal_pain.yes', 'vomiting.yes']],
    '    // 金匮 15.21：诸黄，腹痛而呕者，宜柴胡汤'))
  console.log(appendPath('yiwu_guadi_tang',
    [['huang_dan.yes']],
    '    // 金匮 15.23：瓜蒂汤：治诸黄（与第二篇一物瓜蒂汤同为瓜蒂一味，故并入本方）'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(14) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
