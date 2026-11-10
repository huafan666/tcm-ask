'use strict'
// tools/apply-jingui-chuangyong.js
// 金匮批 19：第十八篇 疮痈肠痈浸淫病脉证并治（18.1 ~ 18.16）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 18.1 脉象立论、18.9 脉象问答 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH18 = '金匮要略·疮痈肠痈浸淫病脉证并治第十八'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'lower_abdomen_swelling_pain',
    title: '小肚子肿起一块、一按就痛',
    kind: 'symptom',
    comment: CH18 + '：肠痈者，少腹肿痞，按之即痛如淋，小便自调。',
    trigger: ['小肚子肿起一块', '少腹肿痞', '小肚子一按就痛', '下腹有肿块按着痛',
      '小腹肿起按之痛', '右下腹按着疼', '肚脐下右侧按着痛'],
    negate: ['小肚子按着不痛'],
    ask: '是不是小肚子肿起一块、一按就明显疼（但小便还正常）？'
  },
  {
    name: 'wound_injury',
    title: '有刀斧外伤伤口',
    kind: 'symptom',
    comment: CH18 + '：若身有疮，被刀斧所伤，亡血故也……病金疮，王不留行散主之。',
    trigger: ['刀斧外伤', '有伤口', '被刀砍伤', '外伤创口', '金疮', '利器划伤',
      '身上有开放性伤口'],
    negate: ['没有外伤'],
    ask: '是不是身上有刀斧、利器造成的外伤伤口？'
  },
  {
    name: 'spreading_skin_sore',
    title: '皮肤疮疡四处蔓延',
    kind: 'symptom',
    comment: CH18 + '：浸淫疮，从口流向四肢者，可治；从四肢流来入口者，不可治。',
    trigger: ['皮肤疮疡四处蔓延', '浸淫疮', '疮面越来越大', '皮肤溃烂往周围扩',
      '黄水疮四处串', '疮蔓延到别处'],
    negate: ['疮不蔓延'],
    ask: '是不是皮肤上有一片疮疡，还不断往周围蔓延扩大？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'chang_yong',
    title: '肠痈',
    kind: 'summary',
    comment: CH18 + '：肠痈之为病，其身甲错，腹皮急，按之濡，如肿状，腹无积聚，身无热，脉数，此为肠内有痈脓……肠痈者，少腹肿痞，按之即痛如淋，小便自调。',
    needs: [
      // 小肚子肿起按之痛 + 小便正常 —— 肠痈最有鉴别意义的组合
      ['lower_abdomen_swelling_pain.yes', 'urination_difficulty.no'],
      // 少腹肿痛 + 发热出汗怕冷
      ['lower_abdomen_swelling_pain.yes', 'fever.yes'],
      // 少腹肿痛 + 腹皮发紧
      ['lower_abdomen_swelling_pain.yes', 'abdominal_tension.yes'],
      // 腹皮急 + 肌肤甲错（久病成脓）
      ['abdominal_tension.yes', 'skin_scaly.yes']
    ],
    contraindications: [
      '肠痈是肠内生的痈脓，最典型的部位是**右下腹**（现代医学的阑尾炎就在这里）',
      '两个关键特征：一是「少腹肿痞，按之即痛」，二是「**小便自调**」——' +
      '小便正常说明问题不在膀胱尿道，而在肠',
      '胀痛按下去是「濡」的（软），原文说「腹无积聚」——不是硬的肿块，是脓在里面',
      '辨脓有无（18.2）：**「以手掩肿上，热者为有脓，不热者为无脓」**——用手捂在肿处，' +
      '觉得热的是已经化脓，不热的是还没化脓',
      '分期用药：脓未成可用下法（大黄牡丹汤）；脓已成则不可再峻下（薏苡附子败酱散）',
      '⚠ 转移性右下腹痛、压痛反跳痛，要立刻急诊排查急性阑尾炎，不能只靠中药观察'
    ],
    ref: CH18 + ' · 肠痈之为病，其身甲错，腹皮急，按之濡，如肿状……此为肠内有痈脓'
  },
  {
    name: 'jin_chuang',
    title: '金疮',
    kind: 'summary',
    comment: CH18 + '：若身有疮，被刀斧所伤，亡血故也……病金疮，王不留行散主之。',
    needs: [
      ['wound_injury.yes'],
      ['wound_injury.yes', 'poor_complexion.yes'],
      ['wound_injury.yes', 'body_pain.yes']
    ],
    contraindications: [
      '金疮是刀斧等金属利器造成的外伤，古人把金刃所伤叫「金疮」',
      '原文 18.9 有一句很实用的话：脉浮微而涩本来应该是有出血或出汗，' +
      '如果既没汗也没明显出血，那就要想到「身有疮，被刀斧所伤，亡血」——就是有外伤失血',
      '治疗用王不留行散：既能内服（止血、活血、消肿），也能外敷（「小疮即粉之」）',
      '⚠ 外伤伤口必须先清创、消毒、打破伤风，中药只是辅助，伤口深大必须就医'
    ],
    ref: CH18 + ' · 病金疮，王不留行散主之'
  },
  {
    name: 'jin_yin_chuang',
    title: '浸淫疮',
    kind: 'summary',
    comment: CH18 + '：浸淫疮，从口流向四肢者，可治；从四肢流来入口者，不可治。浸淫疮，黄连粉主之。',
    needs: [
      ['spreading_skin_sore.yes'],
      ['spreading_skin_sore.yes', 'skin_itch_hives.yes'],
      ['spreading_skin_sore.yes', 'oozing_skin.yes']
    ],
    contraindications: [
      '浸淫疮是**不断向周围蔓延**的皮肤疮疡，「浸淫」就是像水浸润一样越扩越大',
      '原文用走向判断预后：「从口流向四肢者，可治；从四肢流来入口者，不可治」——' +
      '**从躯干往四肢蔓延的好治，从四肢往躯干（尤其向口）蔓延的难治**。这是古人观察疾病向心性扩散的经验',
      '治疗用黄连粉外敷，黄连苦寒清热燥湿',
      '对应现代的湿疹、脓疱疮、接触性皮炎一类渗出性皮肤病',
      '⚠ 大面积渗出、发热、红肿扩散的要及时就医，警惕皮肤感染扩散'
    ],
    ref: CH18 + ' · 浸淫疮，从口流向四肢者，可治；从四肢流来入口者，不可治'
  }
]

// 浸淫疮要用的渗水症状
const EXTRA_SYMPTOMS = [
  {
    name: 'oozing_skin',
    title: '皮肤渗水流水',
    kind: 'symptom',
    comment: CH18 + '：浸淫疮（疮面渗水、蔓延）。',
    trigger: ['皮肤渗水', '皮肤流水', '疮面流水', '流水不止', '皮肤湿漉漉渗液',
      '疮里渗出黄水'],
    negate: ['皮肤干燥不渗水'],
    ask: '是不是皮肤（疮面）会渗水、流黄水？'
  }
]

// ---------- 方剂 5 个新建 ----------
const FORMULAS = [
  {
    name: 'yiyi_fuzi_baijiang_san',
    title: '薏苡附子败酱散',
    kind: 'formula',
    comment: CH18 + '：肠痈之为病，其身甲错，腹皮急，按之濡，如肿状，腹无积聚，身无热，脉数，此为肠内有痈脓，薏苡附子败酱散主之。',
    needs: [
      // 肠痈 + 不发热（脓已成、正气已虚）
      ['chang_yong.yes', 'fever.no'],
      ['lower_abdomen_swelling_pain.yes', 'skin_scaly.yes'],
      ['lower_abdomen_swelling_pain.yes', 'abdominal_tension.yes']
    ],
    contraindications: [
      '治肠痈**脓已成**而正气不足者：腹部按之软（如肿状）、身不发热、肌肤甲错（皮肤粗糙）',
      '三味：薏苡仁（排脓利湿）、附子（温阳扶正）、败酱草（清热解毒排脓）',
      '为什么「身无热」反而用这个方：原文说「腹无积聚，身无热，脉数」——' +
      '不发热说明已经不是急性实热期，而是脓成日久、正气偏虚，所以要**温阳与排脓并用**',
      '服法「杵为末，取方寸匕，以水二升，煎减半，顿服，小便当下」',
      '⚠ 急性阑尾炎不能只靠这首方，必须急诊评估'
    ],
    ref: CH18 + ' · 薏苡附子败酱散（薏苡仁十分、附子二分、败酱五分）'
  },
  {
    name: 'dahuang_mudan_tang',
    title: '大黄牡丹汤',
    kind: 'formula',
    comment: CH18 + '：肠痈者，少腹肿痞，按之即痛如淋，小便自调，时时发热，自汗出，复恶寒。其脉迟紧者，脓未成，可下之，当有血。脉洪数者，脓已成，不可下也，大黄牡丹汤主之。',
    needs: [
      // 肠痈 + 发热 + 少腹肿痛（脓未成、可下）
      ['lower_abdomen_swelling_pain.yes', 'fever.yes', 'sweat.yes'],
      ['lower_abdomen_swelling_pain.yes', 'severe_abdominal_pain.yes'],
      ['chang_yong.yes', 'constipation.yes']
    ],
    contraindications: [
      '治肠痈**脓未成**阶段：少腹肿痞、按之剧痛、发热自汗、恶寒',
      '五味：大黄、芒硝、桃仁、牡丹皮、冬瓜仁——**泻热破瘀、散结消痈**',
      '原文的用药时机最关键：「**脉迟紧者，脓未成，可下之，当有血；脉洪数者，脓已成，不可下也**」——' +
      '脓还没成就用下法把它消掉；脓已经成了就不能再峻下，改用薏苡附子败酱散',
      '这是「痈未成可下、已成不可下」的经典判据',
      '⚠ 急性阑尾炎属外科急症，出现穿孔征象（腹肌紧张、反跳痛）必须立即手术，不能服药观察'
    ],
    ref: CH18 + ' · 大黄牡丹汤（大黄四两、牡丹一两、桃仁五十个、瓜子半升、芒硝三合）'
  },
  {
    name: 'wangbuliuxing_san',
    title: '王不留行散',
    kind: 'formula',
    comment: CH18 + '：病金疮，王不留行散主之。',
    needs: [
      ['jin_chuang.yes']
    ],
    contraindications: [
      '治金疮（刀斧外伤）——既能内服也能外敷，是内外两用的方',
      '王不留行（活血止血消肿）为主，配蒴藋细叶、桑东南根白皮、黄芩、芍药、厚朴、干姜、川椒、甘草',
      '原文两种用法：「**小疮即粉之**」（小伤口直接把药粉撒上去）、' +
      '「大疮但服之」（大伤口则内服），"产后亦可服"',
      '原文对采药时间很讲究：王不留行八月采、蒴藋七月七日采、桑根皮三月三日采',
      '⚠ 外伤优先清创消毒、打破伤风；深大伤口须就医缝合'
    ],
    ref: CH18 + ' · 王不留行散（王不留行十分、蒴藋细叶十分、桑东南根白皮十分、甘草十八分、川椒三分、黄芩二分、干姜二分、芍药二分、厚朴二分）'
  },
  {
    name: 'painong_san',
    title: '排脓散',
    kind: 'formula',
    comment: CH18 + '：排脓散方：枳实十六枚，芍药六分，桔梗一分。',
    needs: [
      // 痈脓已成、需要排脓（配合肠痈/疮痈）
      ['chang_yong.yes', 'foul_pus_sputum.yes'],
      ['chang_yong.yes', 'lower_abdomen_swelling_pain.yes']
    ],
    contraindications: [
      '治痈脓已成、需要排脓外出者',
      '三味：枳实（破气散结）、芍药（和血）、桔梗（载药上行、排脓）',
      '桔梗是排脓的要药，后世「桔梗汤」排肺痈脓也用它',
      '原文用法：「杵为散，取鸡子黄一枚，以药散与鸡黄相等，揉和令相得，饮和服之，日一服」——' +
      '用鸡子黄和药，取滋养之意',
      '和金匮 7.13 的桔梗汤（肺痈排脓）思路相通，但本方偏「通用排脓」'
    ],
    ref: CH18 + ' · 排脓散方（枳实十六枚、芍药六分、桔梗一分）'
  },
  {
    name: 'huanglian_fen',
    title: '黄连粉',
    kind: 'formula',
    comment: CH18 + '：浸淫疮，黄连粉主之。',
    needs: [['jin_yin_chuang.yes']],
    contraindications: [
      '治浸淫疮的外用方，只有黄连一味，研粉外敷',
      '黄连苦寒，清热燥湿、泻火解毒，是治湿热疮疡的经典外用药',
      '原文只说「黄连粉主之」，没给具体用法，一般作散剂撒布或调敷患处',
      '⚠ 只可外用，不可内服（内服用量另论）',
      '⚠ 疮面大面积渗出、扩散、伴发热的须及时就医'
    ],
    ref: CH18 + ' · 浸淫疮，黄连粉主之'
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

const ALL_SYMPTOMS = NEW_SYMPTOMS.concat(EXTRA_SYMPTOMS)
const errors = []
for (const s of ALL_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const f of SUMMARIES.concat(FORMULAS)) if (registry[f.name]) errors.push(f.name + ' 已存在')
const willExist = new Set(
  ALL_SYMPTOMS.map(s => s.name)
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
for (const s of ALL_SYMPTOMS) {
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

if (WRITE) {
  for (const s of ALL_SYMPTOMS) {
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
  for (const s of ALL_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + ALL_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂')
} else {
  for (const s of ALL_SYMPTOMS) console.log('\n症状 ' + s.name + '（' + s.title + '）｜' + s.ask)
  for (const s of SUMMARIES) {
    console.log('\n证候 ' + s.name + '（' + s.title + '）')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n方剂：')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(20) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
