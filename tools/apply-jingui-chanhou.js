'use strict'
// tools/apply-jingui-chanhou.js
// 金匮批 22：第二十一篇 妇人产后病脉证治（21.1 ~ 21.11）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 21.1 是新产三病的病机总述（痉/郁冒/大便难），并入对应证候说明，不单独建节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH21 = '金匮要略·妇人产后病脉证治第二十一'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'postpartum',
    title: '刚生完孩子',
    kind: 'symptom',
    comment: CH21 + '：新产妇人有三病，一者病痉，二者病郁冒，三者大便难。',
    trigger: ['刚生完孩子', '刚生产完', '产后', '坐月子', '新产后', '分娩后不久',
      '刚分娩完'],
    negate: ['不是产后'],
    ask: '是不是刚生完孩子不久（产后）？'
  },
  {
    name: 'head_sweat_only',
    title: '只有头上出汗',
    kind: 'symptom',
    comment: CH21 + '：产妇郁冒……但头汗出……以血虚下厥，孤阳上出，故头汗出。',
    trigger: ['只有头上出汗', '但头汗出', '光头上冒汗', '身上不出汗就头部出汗',
      '头上一直冒汗', '汗只在头上'],
    negate: ['全身都出汗'],
    ask: '是不是只有头上出汗，身上其他地方不出汗？'
  },
  {
    name: 'lochia_retention',
    title: '产后恶露排不干净',
    kind: 'symptom',
    comment: CH21 + '：产后七八日，无太阳证，少腹坚痛，此恶露不尽。',
    trigger: ['恶露排不干净', '恶露不尽', '产后恶露一直不干净', '产后下血淋漓不断',
      '恶露拖很久', '产后血没排干净'],
    negate: ['恶露正常'],
    ask: '是不是产后恶露（下血）一直排不干净？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'yu_mao',
    title: '郁冒',
    kind: 'summary',
    comment: CH21 + '：产妇郁冒，其脉微弱，呕不能食，大便反坚，但头汗出。所以然者，血虚而厥，厥而必冒……以血虚下厥，孤阳上出，故头汗出。',
    needs: [
      // 产后 + 头汗出 + 呕不能食 —— 郁冒的典型组合
      ['postpartum.yes', 'head_sweat_only.yes'],
      ['postpartum.yes', 'vomiting.yes', 'low_appetite.yes'],
      ['postpartum.yes', 'dizziness.yes', 'head_sweat_only.yes']
    ],
    contraindications: [
      '郁冒是产后三大病之一（痉、郁冒、大便难）：「冒」就是**头晕目眩、昏蒙不清**，' +
      '「郁」是气机郁滞不舒',
      '典型表现：脉微弱、呕吐吃不下、大便反而干硬、**只有头上出汗**',
      '病机原文讲得清楚：**血虚下厥，孤阳上出**——产后失血多、下焦虚寒（下厥），' +
      '虚阳被逼得上浮（孤阳上出），所以只有头部出汗、头目昏冒',
      '原文给了预后：「冒家欲解，必大汗出」——郁冒将解时会出一身大汗，汗出则阴阳调和',
      '治法思路是养血益气、调和阴阳（小柴胡汤类或桂枝汤类），不是单纯止汗'
    ],
    ref: CH21 + ' · 产妇郁冒……以血虚下厥，孤阳上出，故头汗出'
  },
  {
    name: 'e_lu_bu_jin',
    title: '恶露不尽',
    kind: 'summary',
    comment: CH21 + '：产后七八日，无太阳证，少腹坚痛，此恶露不尽；不大便，烦躁发热……宜大承气汤主之。热在里，结在膀胱也。',
    needs: [
      // 产后 + 恶露不尽 + 少腹硬痛
      ['postpartum.yes', 'lochia_retention.yes'],
      ['lochia_retention.yes', 'lower_abdomen_cramp.yes'],
      ['postpartum.yes', 'lower_abdomen_cramp.yes', 'fixed_mass.yes']
    ],
    contraindications: [
      '恶露不尽指产后瘀血排不干净，表现为**少腹坚硬疼痛、恶露淋漓不断**',
      '原文还提示：若同时不大便、烦躁发热、傍晚加重、吃不下、吃了说胡话，' +
      '那是「热在里，结在膀胱」，属实热结滞，可用大承气汤攻下',
      '若只是腹痛、恶露不尽而无实热，则用下瘀血汤化瘀（腹中有瘀血著脐下）',
      '⚠ 产后出血/恶露异常要警惕**胎盘残留、子宫复旧不全、感染**，须做超声检查'
    ],
    ref: CH21 + ' · 产后七八日，无太阳证，少腹坚痛，此恶露不尽'
  }
]

// ---------- 方剂 5 个新建 ----------
const FORMULAS = [
  {
    name: 'zhishi_shaoyao_san',
    title: '枳实芍药散',
    kind: 'formula',
    comment: CH21 + '：产后腹痛，烦满不得卧，枳实芍药散主之。',
    needs: [
      // 产后 + 腹痛 + 烦满（气滞为主）
      ['postpartum.yes', 'abdominal_pain.yes', 'restless.yes'],
      ['postpartum.yes', 'abdominal_pain.yes', 'chest_qi_stuffiness.yes'],
      ['postpartum.yes', 'abdominal_tension.yes']
    ],
    contraindications: [
      '治产后腹痛而**烦满不得卧**——肚子痛、心里烦、胀得躺不住，偏气滞',
      '只有两味：枳实（破气散结）、芍药（和血缓急），等分为散',
      '原文用法：「服方寸匕，日三服，并主痈脓，以麦粥下之」——用麦粥送服，护胃',
      '和当归生姜羊肉汤的区别：本方偏**气滞实痛**；当归生姜羊肉汤偏**虚寒隐痛**',
      '若服后不愈，说明不是单纯气滞，而是「腹中有瘀血著脐下」，要改用下瘀血汤'
    ],
    ref: CH21 + ' · 产后腹痛，烦满不得卧，枳实芍药散主之（枳实、芍药等分）'
  },
  {
    name: 'xiayuxue_tang',
    title: '下瘀血汤',
    kind: 'formula',
    comment: CH21 + '：产妇腹痛，法当以枳实芍药散，假令不愈者，此为腹中有瘀血著脐下，宜下瘀血汤主之；亦主经水不利。',
    needs: [
      // 产后腹痛 + 固定包块（瘀血著脐下）
      ['postpartum.yes', 'fixed_mass.yes', 'abdominal_pain.yes'],
      ['e_lu_bu_jin.yes', 'fixed_mass.yes'],
      ['postpartum.yes', 'abdominal_pain.yes', 'constipation.yes']
    ],
    contraindications: [
      '治产后瘀血结在脐下：腹痛、有固定包块、枳实芍药散治不好的那种',
      '三味：大黄、桃仁、䗪虫（土元），「炼蜜和为四丸，以酒一升，煎一丸，取八合顿服之」',
      '原文说「**新血下如豚肝**」——服药后排出像猪肝样的瘀血块，是瘀血排出的表现',
      '本方也治「经水不利」（月经不通）',
      '⚠ **破血力峻，产后体虚者慎用**；出血多、有感染、剖宫产伤口未愈者忌用；孕妇绝对禁用'
    ],
    ref: CH21 + ' · 此为腹中有瘀血著脐下，宜下瘀血汤主之（大黄三两、桃仁二十枚、䗪虫二十枚）'
  },
  {
    name: 'zhuye_tang',
    title: '竹叶汤',
    kind: 'formula',
    comment: CH21 + '：产后中风，发热，面正赤，喘而头痛，竹叶汤主之。',
    needs: [
      // 产后 + 发热 + 面赤 + 喘
      ['postpartum.yes', 'fever.yes', 'face_red_patches.yes'],
      ['postpartum.yes', 'fever.yes', 'orthopnea.yes'],
      ['postpartum.yes', 'sweat.yes', 'wind_aversion.yes']
    ],
    contraindications: [
      '治产后外感风邪而**正虚邪实**：发热、脸红、气喘、头痛',
      '组成：竹叶、葛根、防风、桔梗、桂枝、人参、甘草、附子、生姜、大枣——' +
      '**既有解表散邪，又有人参附子扶正**，是「扶正祛邪」并用',
      '为什么面红还用温药：产后多虚，脸红是「虚阳上浮」而非实热，所以要温阳益气、' +
      '同时轻宣表邪',
      '⚠ 产后发热首先要排除**产褥感染**（恶露臭、子宫压痛、高热），那是急症，须立即就医',
      '⚠ 方中有附子，有毒须炮制久煎'
    ],
    ref: CH21 + ' · 产后中风，发热，面正赤，喘而头痛，竹叶汤主之'
  },
  {
    name: 'zhupi_dawan',
    title: '竹皮大丸',
    kind: 'formula',
    comment: CH21 + '：妇人乳中虚，烦乱呕逆，安中益气，竹皮大丸主之。',
    needs: [
      // 哺乳期 + 心烦 + 呕逆（乳中虚）
      ['postpartum.yes', 'restless.yes', 'vomiting.yes'],
      ['postpartum.yes', 'restless.yes', 'low_energy.yes']
    ],
    contraindications: [
      '治「乳中虚」——**哺乳期**气血亏虚，出现心烦意乱、恶心呕吐',
      '四味：生竹茹、石膏（清热除烦）、桂枝、甘草（温中益气），加白薇',
      '原文点明治法叫「**安中益气**」——不是单纯止呕，而是补中气、清虚热',
      '原文还有加减：「有热者，倍白薇；烦喘者，加柏实一分」',
      '⚠ 哺乳期用药要考虑对婴儿的影响，须医师指导'
    ],
    ref: CH21 + ' · 妇人乳中虚，烦乱呕逆，安中益气，竹皮大丸主之（生竹茹二分、石膏二分、桂枝一分、甘草七分、白薇一分）'
  },
  {
    name: 'baitouweng_jia_gancao_ajiao_tang',
    title: '白头翁加甘草阿胶汤',
    kind: 'formula',
    comment: CH21 + '：产后下利虚极，白头翁加甘草阿胶汤主之。',
    needs: [
      // 产后 + 下利 + 虚极
      ['postpartum.yes', 'diarrhea.yes', 'low_energy.yes'],
      ['postpartum.yes', 'diarrhea.yes', 'poor_complexion.yes'],
      ['postpartum.yes', 'diarrhea.yes', 'tenesmus.yes']
    ],
    contraindications: [
      '治「产后下利虚极」——产后本就气血大亏，又拉肚子，虚上加虚',
      '就是白头翁汤（白头翁、黄连、黄柏、秦皮）**加甘草、阿胶**：' +
      '白头翁汤清热燥湿止痢，甘草缓中，阿胶养血滋阴',
      '为什么加这两味：产后「虚极」，单纯用苦寒的清热药会再伤正气，所以一边清一边补',
      '和白头翁汤的区别：白头翁汤治热利下重（实证），本方**兼虚**',
      '⚠ 产后腹泻伴发热、腹痛剧烈要排除产褥感染与肠道感染'
    ],
    ref: CH21 + ' · 产后下利虚极，白头翁加甘草阿胶汤主之（白头翁汤加甘草、阿胶各二两）'
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
  console.log(appendPath('dachengqi_tang',
    [['postpartum.yes', 'constipation.yes', 'delirium.yes'],
      ['postpartum.yes', 'lochia_retention.yes', 'fever.yes']],
    '    // 金匮 21.3/21.7：病解能食七八日更发热此为胃实；产后七八日少腹坚痛恶露不尽、不大便烦躁发热，宜大承气汤'))
  console.log(appendPath('dangui_shengjiang_yangrou_tang',
    [['postpartum.yes', 'abdominal_pain.yes', 'cold_aversion.yes']],
    '    // 金匮 21.4：产后腹中痛，当归生姜羊肉汤主之，并治腹中寒疝、虚劳不足'))
  console.log(appendPath('guizhi_tang',
    [['postpartum.yes', 'fever.yes', 'wind_aversion.yes', 'vomiting.yes']],
    '    // 金匮 21.8：产后风……头微痛，恶寒，时时有热，心下闷，干呕，汗出……可与阳旦汤（阳旦汤即桂枝汤）'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(26) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
