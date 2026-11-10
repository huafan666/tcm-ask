'use strict'
// tools/apply-jingui-jingji.js
// 金匮批 18：第十六篇 惊悸吐衄下血胸满瘀血病脉证并治（16.1 ~ 16.19）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 16.1/16.2/16.3/16.5/16.8 脉象条、16.4/16.9 禁忌条、16.6 死证、16.7 病机条 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH16 = '金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'epistaxis',
    title: '流鼻血',
    kind: 'symptom',
    comment: CH16 + '：衄家不可汗……心气不足，吐血、衄血，泻心汤主之。',
    trigger: ['流鼻血', '鼻出血', '衄血', '鼻子出血', '鼻子常流血', '无缘无故流鼻血'],
    negate: ['不流鼻血'],
    ask: '是不是会流鼻血（鼻子出血）？'
  },
  {
    name: 'hematemesis',
    title: '吐血',
    kind: 'symptom',
    comment: CH16 + '：夫酒客咳者，必致吐血……心气不足，吐血、衄血，泻心汤主之。',
    trigger: ['吐血', '吐出血来', '呕出血', '咳嗽吐血', '嘴里吐出血'],
    negate: ['不吐血'],
    ask: '是不是会吐血（从嘴里吐出带血的东西）？'
  },
  {
    name: 'stool_blood',
    title: '大便带血',
    kind: 'symptom',
    comment: CH16 + '：下血，先便后血，此远血也……先血后便，此近血也。',
    trigger: ['大便带血', '便血', '下血', '拉出带血', '大便有血', '上厕所见血'],
    negate: ['大便不带血'],
    ask: '是不是大便时带血？'
  },
  {
    name: 'blood_after_stool',
    title: '先大便后出血（远血）',
    kind: 'symptom',
    comment: CH16 + '：下血，先便后血，此远血也，黄土汤主之。',
    trigger: ['先大便后出血', '先便后血', '大便完了才滴血', '拉完才流血', '便后出血',
      '拉完擦纸上有血'],
    negate: ['不是便后出血'],
    ask: '是不是先把大便拉出来，之后才出血（原文叫「远血」）？'
  },
  {
    name: 'blood_before_stool',
    title: '先出血后大便（近血）',
    kind: 'symptom',
    comment: CH16 + '：下血，先血后便，此近血也，赤小豆当归散主之。',
    trigger: ['先出血后大便', '先血后便', '先流血再拉大便', '血在便的前面', '一蹲下先流血'],
    negate: ['不是便前出血'],
    ask: '是不是先出血，然后才拉出大便（原文叫「近血」）？'
  },
  {
    name: 'thirst_rinse_only',
    title: '口干只想漱口不想咽',
    kind: 'symptom',
    comment: CH16 + '：病人胸满，唇痿舌青，口燥，但欲漱水不欲咽……为有瘀血。',
    trigger: ['口干只想漱口', '但欲漱水不欲咽', '漱漱口就吐掉', '想漱口不想喝水',
      '水含在嘴里不咽下去', '口干含着水又吐了'],
    negate: ['渴了就想大口喝水'],
    ask: '是不是嘴里干，只想含口水漱漱口、并不想咽下去？'
  },
  {
    name: 'tongue_blue',
    title: '舌头颜色青紫',
    kind: 'symptom',
    comment: CH16 + '：病人胸满，唇痿舌青……为有瘀血。',
    trigger: ['舌头颜色青紫', '舌质青紫', '舌青', '舌头紫暗', '舌头颜色发紫',
      '舌头上有紫斑'],
    negate: ['舌色正常'],
    ask: '是不是舌头颜色发青、发紫，或者有紫斑？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'jing_ji',
    title: '惊悸',
    kind: 'summary',
    comment: CH16 + '：寸口脉动而弱，动即为惊，弱则为悸……心下悸者，半夏麻黄丸主之。',
    needs: [
      // 心悸 + 容易受惊（原文把「惊」和「悸」分开：动为惊、弱为悸）
      ['heart_palp.yes', 'low_energy.yes'],
      ['heart_palp.yes', 'restless.yes'],
      ['heart_palp.yes']
    ],
    contraindications: [
      '原文把「惊」和「悸」分开讲：「动即为惊，弱则为悸」——惊是心神不宁、容易受惊；悸是心气不足、心跳不自主',
      '合起来叫惊悸：心跳不安、容易受惊、心神不宁',
      '病位在心，多与心气不足、水饮上凌有关',
      '16.13 的「心下悸」用半夏麻黄丸——那是水饮上凌于心导致的悸'
    ],
    ref: CH16 + ' · 寸口脉动而弱，动即为惊，弱则为悸'
  },
  {
    name: 'yu_xue',
    title: '瘀血',
    kind: 'summary',
    comment: CH16 + '：病人胸满，唇痿舌青，口燥，但欲漱水不欲咽，无寒热……为有瘀血……此为阴伏，是瘀血也，当下之。',
    needs: [
      // 舌青 + 只想漱口不咽 —— 瘀血最特异的一组
      ['tongue_blue.yes', 'thirst_rinse_only.yes'],
      // 舌青 + 胸满 + 大便发黑
      ['tongue_blue.yes', 'chest_stuffy.yes', 'black_stool.yes'],
      // 只想漱口不咽 + 胸满
      ['thirst_rinse_only.yes', 'chest_stuffy.yes'],
      // 舌青 + 肌肤甲错
      ['tongue_blue.yes', 'skin_scaly.yes']
    ],
    contraindications: [
      '瘀血的辨识要点很特别：**「但欲漱水不欲咽」**——嘴里干、只想含口水漱一下，并不想咽下去。' +
      '这是因为瘀血内停、津液不能上承，不是真的缺水',
      '其他表现：胸满、口唇枯萎（唇痿）、**舌质青紫（舌青）**、腹不满但病人自称胀满',
      '16.11 还说「如热状，烦满，口干燥而渴，其脉反无热，此为阴伏」——' +
      '**看着像发热、烦躁口渴，但一摸脉并没有热象**，这是瘀血伏在阴分（叫阴伏）',
      '治法原文明确：「是瘀血也，**当下之**」——瘀血要用下法去',
      '⚠ 舌质青紫、黑便、肌肤甲错这类表现，现代须排查凝血功能、消化道出血、肿瘤等'
    ],
    ref: CH16 + ' · 病人胸满，唇痿舌青，口燥，但欲漱水不欲咽……为有瘀血'
  }
]

// ---------- 方剂 3 个新建 ----------
const FORMULAS = [
  {
    name: 'banxia_mahuang_wan',
    title: '半夏麻黄丸',
    kind: 'formula',
    comment: CH16 + '：心下悸者，半夏麻黄丸主之。',
    needs: [
      // 心下悸（心口窝跳动）+ 水饮征象
      ['heart_palp.yes', 'chest_qi_stuffiness.yes'],
      ['heart_palp.yes', 'tan_yin.yes'],
      ['heart_palp.yes', 'saliva_spit.yes']
    ],
    contraindications: [
      '治水饮上凌于心导致的心下悸——心口窝那里跳动不安',
      '只有两味：半夏（化饮降逆）、麻黄（宣肺通阳），等分为末，蜜丸小豆大',
      '麻黄在这里不是发汗，而是「通阳宣肺」，让水饮有出路；配半夏化饮，阳气一通水饮自散',
      '做成小丸「饮服三丸，日三服」，取缓图之意',
      '和苓桂术甘汤区别：那条是气上冲+起则头眩，本方以心下悸为主'
    ],
    ref: CH16 + ' · 心下悸者，半夏麻黄丸主之（半夏、麻黄等分，蜜丸小豆大）'
  },
  {
    name: 'baiye_tang',
    title: '柏叶汤',
    kind: 'formula',
    comment: CH16 + '：吐血不止者，柏叶汤主之。',
    needs: [
      // 吐血不止 + 偏虚寒（马通汁即马粪绞汁，温涩止血，说明是虚寒性出血）
      ['hematemesis.yes', 'cold_extremities.yes'],
      ['hematemesis.yes', 'low_energy.yes'],
      ['hematemesis.yes', 'poor_complexion.yes']
    ],
    contraindications: [
      '治「吐血不止」而偏**虚寒**者：血色淡、人疲乏、四肢不温',
      '三味：柏叶（凉血止血）、干姜（温中）、艾（温经止血），加马通汁（马粪绞汁）',
      '寒热并用：柏叶凉血、干姜艾叶温中——因为虚寒性出血不能一味凉止血，也不能一味温',
      '原文用法「以水五升，取马通汁一升，合煮取一升，分温再服」',
      '⚠ 吐血不止属急症，必须先排查消化道大出血、支气管扩张咯血等，及时急诊'
    ],
    ref: CH16 + ' · 吐血不止者，柏叶汤主之（柏叶、干姜各三两，艾三把，马通汁一升）'
  },
  {
    name: 'xiexin_tang',
    title: '泻心汤（三黄泻心汤）',
    kind: 'formula',
    comment: CH16 + '：心气不足，吐血、衄血，泻心汤主之。泻心汤：大黄二两，黄连、黄芩各一两。',
    needs: [
      // 吐血/衄血 + 有热象（心烦、面赤）
      ['hematemesis.yes', 'restless.yes'],
      ['epistaxis.yes', 'restless.yes'],
      ['hematemesis.yes', 'face_red_patches.yes'],
      ['epistaxis.yes', 'constipation.yes']
    ],
    contraindications: [
      '治心火亢盛、迫血妄行的吐血、衄血',
      '三味：大黄、黄连、黄芩——即「三黄泻心汤」，苦寒直折火热，火降则血自止',
      '原文的治法叫「**泻心**」，是泻心火而不是补心；这里「心气不足」古义有争议，' +
      '多数注家认为是「心气不定」（心神不安），不是心气虚',
      '服法：「以水三升，煮取一升，顿服之」——一次服完，取速效',
      '⚠ 只适合实热出血；虚寒性出血（面白、肢冷、脉弱）忌用，用了会更糟。' +
      '出血量大时必须立即急诊'
    ],
    ref: CH16 + ' · 心气不足，吐血、衄血，泻心汤主之（大黄二两、黄连、黄芩各一两）'
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
  console.log(appendPath('chixiaodou_dangui_san',
    [['blood_before_stool.yes'], ['stool_blood.yes', 'blood_before_stool.yes']],
    '    // 金匮 16.16：下血，先血后便，此近血也，赤小豆当归散主之'))
  console.log(appendPath('jiuni_tang',
    [['manic.yes', 'heart_palp.yes']],
    '    // 金匮 16.12：火邪者，桂枝去芍药加蜀漆牡蛎龙骨救逆汤主之'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(18) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
