'use strict'
// tools/apply-jingui-baihe.js
// 金匮批 4：第三篇 百合病（1 证候 + 6 方剂）
//
// 用户要求（本批严格执行）：
//   · **白话优先**：节点标题、反问话术、说明全部写成高中生能看懂的大白话；
//     古文病名只作为「方名/病名」保留，不把文言句子直接摆给人看
//   · 要素按事实、不强制数量/阴性；AND 里只放关键症状；病机与症状拆开
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')
const CH3 = '金匮要略·百合病狐惑阴阳毒病脉证并治第三'

// ---------- 新症状（标题全部用大白话）----------
const NEW_SYMPTOMS = [
  {
    name: 'appetite_fluctuating',
    title: '食欲时好时坏',
    kind: 'symptom',
    comment: CH3 + '：意欲食复不能食……欲饮食，或有美时，或有不用闻食臭时。',
    trigger: ['食欲时好时坏', '想吃又吃不下', '想吃吃不下', '想吃东西又吃不下', '想吃东西可又吃不下', '胃口时好时坏', '有时想吃有时不想吃', '不想闻饭味'],
    negate: ['胃口很好', '一直吃得下'],
    ask: '是不是想吃东西，可真到吃的时候又吃不下？胃口一会儿好一会儿坏。'
  },
  {
    name: 'listless_mute',
    title: '提不起劲、不想说话',
    kind: 'symptom',
    comment: CH3 + '：常默默。',
    trigger: ['提不起劲', '不想说话', '不爱说话', '蔫蔫的', '愣愣的'],
    negate: ['精神很好', '话很多'],
    ask: '是不是整天提不起劲，不想说话，也不想动，就愣愣地待着？'
  },
  {
    name: 'restless_lying',
    title: '想躺躺不住',
    kind: 'symptom',
    comment: CH3 + '：欲卧不能卧。',
    trigger: ['想躺躺不住', '躺下又躺不住', '躺下就难受', '躺也躺不踏实'],
    negate: ['躺下就睡得着'],
    ask: '是不是很想躺下来，可躺下又躺不住、怎么都不舒服？'
  },
  {
    name: 'cannot_walk',
    title: '想走走不动',
    kind: 'symptom',
    comment: CH3 + '：欲行不能行。',
    trigger: ['想走走不动', '想动又动不了', '想出门走不动', '懒得动又坐不住'],
    negate: ['行动自如'],
    ask: '是不是想起来走走、活动一下，可又觉得没劲、走不动？'
  },
  {
    name: 'pseudo_cold_heat',
    title: '似冷非冷似热非热',
    kind: 'symptom',
    comment: CH3 + '：如寒无寒，如热无热。',
    trigger: ['似冷非冷', '像冷又不太冷', '觉得冷其实不冷', '觉得热其实不烫', '说冷不算冷说热不算热'],
    negate: ['冷热正常'],
    ask: '是不是有时候觉得冷，可其实并不真冷；有时候觉得发热，量体温又不高？'
  },
  {
    name: 'bitter_taste',
    title: '嘴里发苦',
    kind: 'symptom',
    comment: CH3 + '：口苦，小便赤。',
    trigger: ['嘴里发苦', '口苦', '嘴巴苦', '一早就苦'],
    negate: ['嘴里不苦', '口不苦'],
    ask: '是不是嘴里总发苦，尤其早上起来更明显？'
  }
]

// ---------- 证候：百合病 ----------
const SUMMARY = {
  name: 'baihe_bing',
  title: '百合病',
  kind: 'summary',
  comment: CH3 + '：百合病者，百脉一宗……意欲食复不能食，常默默，欲卧不能卧，欲行不能行，如寒无寒，如热无热，口苦，小便赤。',
  needs: [
    // 神志与饮食的"想做却做不了"是百合病最典型的一组
    ['appetite_fluctuating.yes', 'listless_mute.yes'],
    // 卧、行的"欲而不能"另一组
    ['restless_lying.yes', 'cannot_walk.yes'],
    // 似冷非冷似热非热 + 口苦 + 小便黄
    ['pseudo_cold_heat.yes', 'bitter_taste.yes', 'dark_urine.yes']
  ],
  contraindications: [
    '百合病是一种"想睡睡不着、想吃吃不下、想走走不动"的虚弱状态，常见于热病之后，心神和身体都失养',
    '特点是浑身不对劲，但查不出明显毛病（原文叫「身形如和」）',
    '治疗不能用发汗、泻下、催吐。用了这三种治法会让病情加重（原文：得药则剧吐利）',
    '主方是百合地黄汤；被汗、下、吐折腾过的，改用对应的方（百合知母汤、滑石代赭汤、百合鸡子汤）'
  ],
  ref: CH3 + ' · 百合病者，百脉一宗，悉致其病也'
}

// ---------- 6 个方剂 ----------
const FORMULAS = [
  {
    name: 'baihe_dihuang_tang',
    title: '百合地黄汤',
    comment: CH3 + '：百合病，不经吐、下、发汗，病形如初者，百合地黄汤主之。',
    // 没被汗吐下折腾过的百合病（主方）
    needs: [['baihe_bing.yes']],
    contraindications: [
      '百合病的主方：没发过汗、没泻过下、没催过吐，症状还是最早那个样子的',
      '百合润养心肺、生地黄清热养阴，适合这种"心里烦、身体虚"的状态',
      '吃完可能会拉稀（原文说大便当如漆），是药力起效，不用慌'
    ],
    ref: CH3 + ' · 百合病，不经吐、下、发汗，病形如初者，百合地黄汤主之'
  },
  {
    name: 'baihe_zhimu_tang',
    title: '百合知母汤',
    comment: CH3 + '：百合病发汗后者，百合知母汤主之。',
    needs: [['baihe_bing.yes', 'sweat.yes']],
    contraindications: [
      '本来得的是百合病，结果被误用了发汗药——汗出之后津液更伤，心烦、燥热更明显',
      '百合养阴、知母清热除烦，重点补回被汗夺走的津液',
      '以后不能再发汗'
    ],
    ref: CH3 + ' · 百合病发汗后者，百合知母汤主之'
  },
  {
    name: 'huashi_daizhe_tang',
    title: '滑石代赭汤',
    comment: CH3 + '：百合病下之后者，滑石代赭汤主之。',
    needs: [['baihe_bing.yes', 'diarrhea.yes']],
    contraindications: [
      '本来是百合病，却被误用了泻药——拉完之后胃气上逆、小便不利',
      '滑石利尿、代赭石降胃气，把被泻坏的下焦和中焦都理顺',
      '以后不能再泻下'
    ],
    ref: CH3 + ' · 百合病下之后者，滑石代赭汤主之'
  },
  {
    name: 'baihe_jizi_tang',
    title: '百合鸡子汤',
    comment: CH3 + '：百合病，吐之后者，用后方主之。',
    needs: [['baihe_bing.yes', 'vomiting.yes']],
    contraindications: [
      '本来是百合病，却被误用了催吐法——吐后胃气受损、虚烦不安',
      '鸡蛋黄补中养血，配合百合安神',
      '以后不能再催吐'
    ],
    ref: CH3 + ' · 百合病，吐之后者，用后方主之'
  },
  {
    name: 'baihe_xifang',
    title: '百合洗方',
    comment: CH3 + '：百合病一月不解，变成渴者，百合洗方主之。',
    needs: [['baihe_bing.yes', 'thirsty.yes']],
    contraindications: [
      '百合病拖了一个月还没好，反而添了口渴——热邪郁在肌表，津液上不来',
      '用百合煎水外洗皮肤，从皮毛透邪，配合内服',
      '洗完吃煮饼（面食），不要吃咸的，以免更伤津'
    ],
    ref: CH3 + ' · 百合病一月不解，变成渴者，百合洗方主之'
  },
  {
    name: 'baihe_huashi_san',
    title: '百合滑石散',
    comment: CH3 + '：百合病变发热者，百合滑石散主之。',
    needs: [['baihe_bing.yes', 'fever.yes']],
    contraindications: [
      '百合病本来不太发热，后来反而发起热来——是热郁在里、需要从小便引出去',
      '百合养阴、滑石清热利小便',
      '热一退就停药，久服伤津'
    ],
    ref: CH3 + ' · 百合病变发热者，百合滑石散主之'
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
for (const f of [SUMMARY].concat(FORMULAS)) if (registry[f.name] && !FORCE) errors.push(f.name + ' 已存在')
const willExist = new Set(NEW_SYMPTOMS.map(s => s.name).concat([SUMMARY.name]))
for (const f of [SUMMARY].concat(FORMULAS)) {
  for (const path1 of (f.needs || [])) for (const c of path1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !willExist.has(dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

// 口苦：shaoyang 已经用它当触发词，会同时点亮两个节点，这里明确提示
console.log('=== 触发词查重 ===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      if (name === s.name) continue
      for (const other of kwsOf(registry[name])) {
        if (other === kw || other.includes(kw) || kw.includes(other)) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name + ' 的「' + other + '」重叠'); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处（需人工判断）' : '  没有撞车 ✓')

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
  for (const f of [SUMMARY]) {
    if (registry[f.name] && !FORCE) continue
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 证候 ' + f.name + '（' + f.title + '）')
  }
  for (const f of FORMULAS) {
    if (registry[f.name] && !FORCE) continue
    fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 方剂 ' + f.name + '（' + f.title + '）')
  }
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原方', refs: [s.comment.replace(/^金匮要略·[^：]*：/, '')], by: 'system:jinkui' }
  for (const f of [SUMMARY].concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原方', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：6 症状 + 1 证候 + 6 方剂 + provenance')
} else {
  for (const x of NEW_SYMPTOMS) { console.log('\n=== 症状 ' + x.name + '（' + x.title + '）==='); console.log('问：' + x.ask) }
  console.log('\n=== 证候 ' + SUMMARY.name + '（' + SUMMARY.title + '）===')
  SUMMARY.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  console.log('\n=== 方剂 ===')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(8) + JSON.stringify(f.needs[0]))
  console.log('\n（预览，加 --write 落库）')
}
