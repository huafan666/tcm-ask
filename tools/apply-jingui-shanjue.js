'use strict'
// tools/apply-jingui-shanjue.js
// 金匮批 20：第十九篇 趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治（19.1 ~ 19.16）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 19.1 是针刺治法条（但能前不能却，刺腨）、19.9 是凭脉辨虫条 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH19 = '金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'finger_arm_swelling_tremor',
    title: '手指胳膊肿还发抖',
    kind: 'symptom',
    comment: CH19 + '：病人常以手指臂肿动，此人身体瞤瞤者，藜芦甘草汤主之。',
    trigger: ['手指胳膊肿还发抖', '手指臂肿动', '手指和胳膊肿而且动', '手指发肿还跳动',
      '手臂肿着一阵阵抽动', '手肿还会抖'],
    negate: ['手指胳膊不肿不抖'],
    ask: '是不是手指和胳膊发肿，还一阵阵地抽动、发抖？'
  },
  {
    name: 'limb_straight_spasm',
    title: '胳膊腿绷直抽筋',
    kind: 'symptom',
    comment: CH19 + '：转筋之为病，其人臂脚直……转筋入腹者，鸡屎白散主之。',
    trigger: ['胳膊腿绷直抽筋', '臂脚直', '腿抽筋绷得直', '手脚绷直伸不开',
      '小腿抽筋绷紧', '抽筋抽得腿是直的'],
    negate: ['手脚能自由伸展'],
    ask: '是不是胳膊或腿突然绷直、抽筋，伸不开？'
  },
  {
    name: 'testicle_alternating_swelling',
    title: '阴囊一边大一边小、时上时下',
    kind: 'symptom',
    comment: CH19 + '：阴狐疝气者，偏有小大，时时上下，蜘蛛散主之。',
    trigger: ['阴囊一边大一边小', '偏有小大', '阴囊时上时下', '疝气来回上下',
      '睾丸忽上忽下', '阴囊大小不一样'],
    negate: ['阴囊两边一样大'],
    ask: '是不是阴囊（或睾丸）一边大一边小，还会时上时下地移动？'
  },
  {
    name: 'saliva_heart_pain_paroxysmal',
    title: '吐口水、心口痛一阵一阵',
    kind: 'symptom',
    comment: CH19 + '：蚘虫之为病，令人吐涎，心痛，发作有时，毒药不止，甘草粉蜜汤主之。',
    trigger: ['吐口水心口痛一阵一阵', '吐涎心痛发作有时', '心口痛时好时坏还吐口水',
      '肚子一阵阵痛还流口水', '心口疼一阵一阵发作'],
    negate: ['心口不痛'],
    ask: '是不是心口（肚子）一阵一阵地痛、还老吐口水，发作有时间规律？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'zhuan_jin',
    title: '转筋',
    kind: 'summary',
    comment: CH19 + '：转筋之为病，其人臂脚直……转筋入腹者，鸡屎白散主之。',
    needs: [
      // 胳膊腿绷直抽筋 —— 转筋的定义
      ['limb_straight_spasm.yes'],
      ['limb_straight_spasm.yes', 'cold_extremities.yes'],
      ['limb_straight_spasm.yes', 'muscle_twitching.yes']
    ],
    contraindications: [
      '转筋就是**肌肉突然痉挛、绷直抽住**，最常见于小腿（俗称抽筋）',
      '原文描述「其人臂脚直」——胳膊或腿绷直了伸不开',
      '「转筋入腹者」是重症：痉挛从四肢蔓延到腹部，腹部抽紧，要用鸡屎白散',
      '常见诱因：受寒、大汗后津液不足、霍乱吐泻脱水、缺钙',
      '⚠ 频繁抽筋要查电解质（钙、镁、钾）与是否有脱水、甲状腺等问题'
    ],
    ref: CH19 + ' · 转筋之为病，其人臂脚直'
  },
  {
    name: 'yin_hu_shan',
    title: '阴狐疝',
    kind: 'summary',
    comment: CH19 + '：阴狐疝气者，偏有小大，时时上下，蜘蛛散主之。',
    needs: [
      // 阴囊一边大一边小、时上时下 —— 阴狐疝的特异表现
      ['testicle_alternating_swelling.yes'],
      ['testicle_alternating_swelling.yes', 'abdominal_pain.yes'],
      ['testicle_alternating_swelling.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '阴狐疝就是**疝气**：腹股沟或阴囊时大时小，一用力、一哭闹就鼓出来，躺下又能回去',
      '原文说「偏有小大，时时上下」——偏于一侧、一大一小，而且**能上能下**（疝块来回出入）',
      '「狐」这个字形容它像狐狸一样**出没无常、来去不定**',
      '和寒疝的区别：寒疝（第十篇）是阴寒腹痛，跟疝气不是一回事；本条才是真正的外疝',
      '⚠ 疝块**推不回去、剧痛、伴呕吐**是嵌顿疝，属外科急症，必须立即急诊手术'
    ],
    ref: CH19 + ' · 阴狐疝气者，偏有小大，时时上下'
  },
  {
    name: 'hui_chong',
    title: '蛔虫',
    kind: 'summary',
    comment: CH19 + '：蚘虫之为病，令人吐涎，心痛，发作有时……蚘厥者，当吐蚘，令病者静而复时烦……得食而呕，又烦者，蚘闻食臭出，其人当自吐蚘。',
    needs: [
      // 吐蛔虫 —— 最直接的证据
      ['round_worm_vomit.yes'],
      // 吐口水 + 心口一阵阵痛
      ['saliva_heart_pain_paroxysmal.yes'],
      // 肚子痛 + 吐口水
      ['abdominal_pain.yes', 'saliva_spit.yes']
    ],
    contraindications: [
      '蛔虫病的典型表现：**吐涎、心口痛、发作有时**——肚子一阵一阵痛，还老流口水',
      '「蚘厥」是蛔虫引起的厥证：**吐蛔虫**，人一会儿安静一会儿烦躁，' +
      '「得食而呕又烦者，蚘闻食臭出」——一闻到饭菜香，蛔虫就动起来，所以吃了就呕、又烦',
      '原文说「毒药不止」——用峻烈的杀虫药也止不住，说明要**安蛔**而不是硬杀',
      '治法是「安蛔止痛」：蛔虫「得酸则静、得辛则伏、得苦则下」，所以乌梅丸酸苦辛并用',
      '⚠ 现代蛔虫病已少见，确诊靠查大便虫卵；蛔虫性肠梗阻、胆道蛔虫属急症'
    ],
    ref: CH19 + ' · 蚘虫之为病，令人吐涎，心痛，发作有时'
  }
]

// ---------- 方剂 4 个新建 ----------
const FORMULAS = [
  {
    name: 'lilu_gancao_tang',
    title: '藜芦甘草汤',
    kind: 'formula',
    comment: CH19 + '：病人常以手指臂肿动，此人身体瞤瞤者，藜芦甘草汤主之。',
    needs: [
      // 手指臂肿 + 身体肌肉跳动
      ['finger_arm_swelling_tremor.yes'],
      ['finger_arm_swelling_tremor.yes', 'muscle_twitching.yes']
    ],
    contraindications: [
      '治手指胳膊发肿而且抽动、身体肌肉也跳（瞤瞤）的情况',
      '**原方组成未见于《金匮》正文**，只留方名。后世多认为是藜芦、甘草两味',
      '藜芦是**涌吐药**，有毒，作用峻猛，「吐」的机理可能是通过涌吐痰涎来治「肿动」',
      '⚠ 藜芦毒性大，反甘草（十八反中「诸参辛芍叛藜芦」），现代极少内服，' +
      '**本条仅供文献参考，绝对不可照方自行服用**'
    ],
    ref: CH19 + ' · 病人常以手指臂肿动，此人身体瞤瞤者，藜芦甘草汤主之（方未见）'
  },
  {
    name: 'jishibai_san',
    title: '鸡屎白散',
    kind: 'formula',
    comment: CH19 + '：转筋入腹者，鸡屎白散主之。鸡屎白。',
    needs: [
      // 转筋入腹：抽搐蔓延到腹部
      ['limb_straight_spasm.yes', 'abdominal_tension.yes'],
      ['limb_straight_spasm.yes', 'severe_abdominal_pain.yes'],
      ['zhuan_jin.yes', 'abdominal_tension.yes']
    ],
    contraindications: [
      '治「转筋入腹」——抽筋从四肢蔓延到腹部，腹部抽紧，是转筋的重证',
      '只有一味：鸡屎白（鸡粪上的白色部分，晒干炒用），「为散，取方寸匕，以水六合，和，温服」',
      '鸡屎白古法用于转筋、淋病、腹胀，现代已极少使用',
      '⚠ 现代观点：抽筋入腹要考虑严重电解质紊乱、破伤风、低钙抽搐等，**必须立即就医**，' +
      '不可依赖此类古方'
    ],
    ref: CH19 + ' · 转筋入腹者，鸡屎白散主之（鸡屎白，为散，取方寸匕，以水六合和，温服）'
  },
  {
    name: 'zhizhu_san',
    title: '蜘蛛散',
    kind: 'formula',
    comment: CH19 + '：阴狐疝气者，偏有小大，时时上下，蜘蛛散主之。蜘蛛十四枚，熬焦；桂枝半两。',
    needs: [
      ['yin_hu_shan.yes']
    ],
    contraindications: [
      '治阴狐疝（疝气）：阴囊一大一小、时上时下',
      '两味：蜘蛛（熬焦）、桂枝。「蜘蛛」取「以物治物」之意——蜘蛛能结网捕虫、' +
      '古人取类比象，认为它能「收摄」疝气；桂枝通阳散寒',
      '原文用法：「为散，取八分一匕，饮和服，日再服，蜜丸亦可」',
      '⚠ 蜘蛛入药现代极少使用，且品种须严格鉴定；本条仅供文献参考',
      '⚠ 疝气嵌顿（推不回去、剧痛、呕吐）必须急诊手术，任何内服药都无法解决'
    ],
    ref: CH19 + ' · 蜘蛛散方（蜘蛛十四枚熬焦、桂枝半两）'
  },
  {
    name: 'gancao_fenmi_tang',
    title: '甘草粉蜜汤',
    kind: 'formula',
    comment: CH19 + '：蚘虫之为病，令人吐涎，心痛，发作有时，毒药不止，甘草粉蜜汤主之。',
    needs: [
      // 蛔虫 + 吐涎心痛（杀虫药无效时的安抚法）
      ['saliva_heart_pain_paroxysmal.yes'],
      ['hui_chong.yes', 'abdominal_pain.yes'],
      ['round_worm_vomit.yes', 'saliva_spit.yes']
    ],
    contraindications: [
      '治蛔虫引起的吐涎、心口痛，尤其「**毒药不止**」——用了杀虫猛药也止不住的情况',
      '三味：甘草、粉（米粉或铅粉，历来有争议）、蜜。「甘以缓之」——用甘甜之味安抚蛔虫、缓急止痛',
      '「粉」究竟是米粉还是铅粉，注家分歧很大：主张米粉的说甘缓安蛔；主张铅粉的说兼能杀虫。' +
      '**铅粉有毒，现代绝不可用**',
      '原文用法「以水三升，先煮甘草，取二升，去滓，内粉蜜，搅令和，煎如薄粥，温服一升，差即止」',
      '⚠ 蛔虫性肠梗阻、胆道蛔虫属急症，须就医'
    ],
    ref: CH19 + ' · 甘草粉蜜汤方（甘草二两、粉一两重、蜜四两）'
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
  console.log(appendPath('wumei_wan',
    [['round_worm_vomit.yes', 'restless.yes', 'vomiting.yes']],
    '    // 金匮 19.14：蚘厥者，乌梅丸主之（蛔厥：吐蛔、静而复时烦、得食而呕又烦）'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(16) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
