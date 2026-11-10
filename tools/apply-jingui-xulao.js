'use strict'
// tools/apply-jingui-xulao.js
// 金匮批 8：第六篇 血痹虚劳病脉证并治（6.1 ~ 6.19）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 6.3 / 6.7 / 6.10 / 6.11 / 6.13 以脉象为主（脉大为劳、脉浮弱而涩、脉弦而大名为革……）→ 不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH6 = '金匮要略·血痹虚劳病脉证并治第六'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'semen_loss',
    title: '遗精',
    kind: 'symptom',
    comment: CH6 + '：夫失精家……男子失精……虚劳里急，悸、衄，腹中痛，梦失精。',
    trigger: ['遗精', '失精', '滑精', '夜里漏精', '梦遗', '精气自出', '不自主射精'],
    negate: ['没有遗精'],
    ask: '是不是会有精液不自主地流出来，尤其在夜里或做梦时？'
  },
  {
    name: 'dream_sex',
    title: '梦中性交',
    kind: 'symptom',
    comment: CH6 + '：男子失精，女子梦交，桂枝加龙骨牡蛎汤主之。',
    trigger: ['梦交', '梦里与人交合', '做梦性交', '晚上做梦同房'],
    negate: ['没有这种梦'],
    ask: '是不是晚上做梦时会有男女交合的梦境，醒来很累？'
  },
  {
    name: 'night_sweat',
    title: '睡着后出汗',
    kind: 'symptom',
    comment: CH6 + '：男子平人，脉虚弱细微者，喜盗汗也。',
    trigger: ['睡着后出汗', '盗汗', '夜里出汗', '睡着了出汗', '半夜一身汗', '起床发现衣服湿了'],
    negate: ['睡着不出汗', '没有盗汗'],
    ask: '是不是一睡着就出汗，醒来发现衣服、被子都湿了？'
  },
  {
    name: 'genital_cold',
    title: '前阴发冷',
    kind: 'symptom',
    comment: CH6 + '：夫失精家少腹弦急，阴头寒。',
    trigger: ['前阴发冷', '阴头寒', '下身发凉', '生殖器发凉', '阴部发冷'],
    negate: ['下身不凉'],
    ask: '是不是下身（前阴）总是发凉、摸着冷？'
  },
  {
    name: 'lower_abdomen_cramp',
    title: '小肚子发紧拘急',
    kind: 'symptom',
    comment: CH6 + '：夫失精家少腹弦急；虚劳腰痛，少腹拘急。',
    trigger: ['小肚子发紧', '少腹弦急', '少腹拘急', '小腹抽紧', '肚子下面绷得紧',
      '小肚子一阵阵抽紧', '小腹拘急'],
    negate: ['小肚子不紧'],
    ask: '是不是小肚子（肚脐以下）发紧、绷着，一阵阵抽紧不舒服？'
  },
  {
    name: 'abdominal_tension',
    title: '肚子拘急发紧',
    kind: 'symptom',
    comment: CH6 + '：虚劳里急……虚劳里急、诸不足。',
    trigger: ['肚子拘急', '腹中拘急', '里急', '肚子一阵阵抽紧', '肚子里绷得紧',
      '腹部拘急不舒服', '肚子发紧发痛'],
    negate: ['肚子不紧'],
    ask: '是不是肚子里面绷得紧、一阵阵抽着不舒服（原文叫「里急」）？'
  },
  {
    name: 'skin_scaly',
    title: '皮肤干得像鱼鳞',
    kind: 'symptom',
    comment: CH6 + '：内有干血，肌肤甲错，两目黯黑。',
    trigger: ['皮肤干得像鱼鳞', '肌肤甲错', '皮肤粗糙起鳞', '皮肤像蛇皮', '皮肤干枯成片',
      '腿上皮肤像鱼鳞', '皮肤粗糙发硬'],
    negate: ['皮肤光滑'],
    ask: '是不是皮肤又干又粗糙，像鱼鳞、蛇皮一样一片一片的？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'xue_bi',
    title: '血痹',
    kind: 'summary',
    comment: CH6 + '：血痹阴阳俱微……外证身体不仁，如风痹状，黄芪桂枝五物汤主之。',
    needs: [
      // 身体麻木不仁是血痹的**唯一外证**
      ['limb_numbness.yes']
    ],
    contraindications: [
      '血痹的唯一外证就是「身体不仁」——肌肤麻木、知觉迟钝，看起来像风痹但不是',
      '原文说的病因很具体：生活优裕、骨弱肌肤盛的人，劳累出汗后躺着又翻来覆去，被微风吹到，就得了',
      '病机是阳气痹阻、血行不畅，所以治法是「针引阳气」或温阳行痹，不是单纯补血',
      '和真中风区别：血痹只有麻木，没有半身不遂、口眼歪斜'
    ],
    ref: CH6 + ' · 外证身体不仁，如风痹状，黄芪桂枝五物汤主之'
  },
  {
    name: 'xu_lao',
    title: '虚劳',
    kind: 'summary',
    comment: CH6 + '：夫男子平人，脉大为劳，极虚亦为劳……虚劳里急，悸、衄，腹中痛，梦失精，四肢酸疼，手足烦热，咽干口燥。',
    needs: [
      // 消瘦 + 手足烦热 + 咽干口燥（典型的阴虚虚劳）
      ['weight_loss.yes', 'hand_foot_hot.yes', 'throat_dry.yes'],
      // 盗汗 + 遗精（精血亏耗）
      ['night_sweat.yes', 'semen_loss.yes'],
      // 肚子拘急 + 心悸 + 手足烦热
      ['abdominal_tension.yes', 'heart_palp.yes', 'hand_foot_hot.yes'],
      // 极瘦 + 皮肤甲错 + 不能吃饭（干血劳）
      ['weight_loss.yes', 'skin_scaly.yes', 'low_appetite.yes']
    ],
    contraindications: [
      '虚劳不是一个病，是一大类「精气内伤、久虚不复」的状态：消瘦、没劲、盗汗、手足心热、口干、心慌',
      '原文反复强调「脉大为劳，极虚亦为劳」——脉大而无力也是虚，别被「脉大」骗成实证',
      '按兼症分几种走向：偏阳气虚（小建中汤、黄芪建中汤）、偏肾虚（八味肾气丸）、偏虚烦不眠（酸枣仁汤）、干血内结（大黄䗪虫丸）',
      '治疗大法是「缓中补虚」——慢慢补，不能猛补也不能猛攻',
      '和一般疲劳的区别：虚劳有明显的形体消瘦、盗汗、手足心热、脉象极虚，病程长'
    ],
    ref: CH6 + ' · 夫男子平人，脉大为劳，极虚亦为劳'
  }
]

// ---------- 方剂 7 个 ----------
const FORMULAS = [
  {
    name: 'huangqi_guizhi_wuwu_tang',
    title: '黄芪桂枝五物汤',
    kind: 'formula',
    comment: CH6 + '：血痹……外证身体不仁，如风痹状，黄芪桂枝五物汤主之。',
    needs: [['xue_bi.yes']],
    contraindications: [
      '血痹专方：肌肤麻木不仁、像风痹那样，但以麻木为主',
      '黄芪补气行痹为君，桂枝、芍药、生姜、大枣调和营卫、温通血脉',
      '即桂枝汤去甘草、加黄芪，倍生姜——因为要「走表行痹」，不想让甘草把药力留住',
      '原文还说可以先「针引阳气」，针药并用效果更好'
    ],
    ref: CH6 + ' · 黄芪桂枝五物汤方（黄芪三两、芍药三两、桂枝三两、生姜六两、大枣十二枚）'
  },
  {
    name: 'guizhi_jia_longgumuli_tang',
    title: '桂枝加龙骨牡蛎汤',
    kind: 'formula',
    comment: CH6 + '：夫失精家少腹弦急，阴头寒，目眩，发落……男子失精，女子梦交，桂枝加龙骨牡蛎汤主之。',
    needs: [
      // 遗精/梦交 + 少腹拘急
      ['semen_loss.yes', 'lower_abdomen_cramp.yes'],
      ['dream_sex.yes', 'lower_abdomen_cramp.yes'],
      // 遗精 + 前阴发冷 + 脱发
      ['semen_loss.yes', 'genital_cold.yes'],
      // 遗精/梦交 + 目眩 + 脱发
      ['semen_loss.yes', 'dizziness.yes', 'tuofa.yes'],
      ['dream_sex.yes', 'dizziness.yes']
    ],
    contraindications: [
      '治「失精家」：频繁遗精或梦交，伴有小肚子抽紧、前阴发凉、头晕、掉头发',
      '病机是阴阳两虚、精关不固，心神浮越——所以要既调阴阳又重镇安神',
      '即桂枝汤加龙骨、牡蛎，桂枝汤调和阴阳，龙牡收敛固涩、镇摄浮阳',
      '注意与桂枝甘草龙骨牡蛎汤（火逆烦躁）区别：那条是误治后的烦躁，没有失精梦交'
    ],
    ref: CH6 + ' · 桂枝加龙骨牡蛎汤方（桂枝汤加龙骨、牡蛎各三两）'
  },
  {
    name: 'huangqi_jianzhong_tang',
    title: '黄芪建中汤',
    kind: 'formula',
    comment: CH6 + '：虚劳里急、诸不足，黄芪建中汤主之。',
    needs: [
      ['abdominal_tension.yes', 'low_energy.yes'],
      ['abdominal_tension.yes', 'weight_loss.yes'],
      ['abdominal_tension.yes']
    ],
    contraindications: [
      '治虚劳「里急、诸不足」——肚子拘急发紧，加上各种虚（没劲、消瘦、气短）',
      '就是小建中汤加黄芪：小建中温中缓急，黄芪补气固表',
      '比小建中汤更偏气虚，适合虚得厉害、还容易出汗怕风的',
      '同样「呕家不可用」——方里饴糖多，呕吐的人吃了更难受'
    ],
    ref: CH6 + ' · 虚劳里急、诸不足，黄芪建中汤主之'
  },
  {
    name: 'bawei_shenqi_wan',
    title: '八味肾气丸',
    kind: 'formula',
    comment: CH6 + '：虚劳腰痛，少腹拘急，小便不利者，八味肾气丸主之。',
    needs: [
      ['yaosuan.yes', 'lower_abdomen_cramp.yes'],
      ['yaosuan.yes', 'urination_difficulty.yes'],
      ['lower_abdomen_cramp.yes', 'urination_difficulty.yes']
    ],
    contraindications: [
      '治肾虚型的虚劳：腰酸腰痛、小肚子拘急、小便不顺畅',
      '八味＝六味地黄丸加桂枝（或肉桂）、附子——在滋补肾阴的基础上温阳化气',
      '治法是「少火生气」：用少量温药慢慢化生肾气，不是猛补阳',
      '小便不利而口渴、或夜尿多，都属于这个方向'
    ],
    ref: CH6 + ' · 虚劳腰痛，少腹拘急，小便不利者，八味肾气丸主之'
  },
  {
    name: 'shuyu_wan',
    title: '薯蓣丸',
    kind: 'formula',
    comment: CH6 + '：虚劳诸不足，风气百疾，薯蓣丸主之。',
    needs: [
      ['xu_lao.yes', 'wind_aversion.yes'],
      ['xu_lao.yes', 'body_pain.yes']
    ],
    contraindications: [
      '治虚劳各种不足，同时反复受风、浑身不舒服（原文叫「风气百疾」）',
      '二十多味的大方，但核心是薯蓣（山药）重用健脾，配四君子、四物等补气血，再加防风、桂枝等祛风',
      '特点是「补中有散」——正虚又兼风邪时用，一味补会恋邪，一味散会更虚',
      '做成丸药缓图，适合长期调养'
    ],
    ref: CH6 + ' · 虚劳诸不足，风气百疾，薯蓣丸主之'
  },
  {
    name: 'suanzaoren_tang',
    title: '酸枣仁汤',
    kind: 'formula',
    comment: CH6 + '：虚劳虚烦不得眠，酸枣仁汤主之。',
    needs: [
      // 虚烦不得眠 + 口干（阴血不足）
      ['vex_insomnia.yes', 'throat_dry.yes'],
      ['vex_insomnia.yes', 'heart_palp.yes'],
      ['vex_insomnia.yes']
    ],
    contraindications: [
      '治虚劳引起的失眠：心里烦躁、躺不住、睡不着',
      '酸枣仁养肝血安神为君，知母清热除烦，茯苓宁心，川芎调血，甘草调和',
      '重点在「虚」——是肝血不足、虚热内扰，不是实火',
      '和栀子豉汤（心中懊恼、反复颠倒）区别：那条是热郁胸膈，多有身热、舌苔黄'
    ],
    ref: CH6 + ' · 虚劳虚烦不得眠，酸枣仁汤主之'
  },
  {
    name: 'dahuang_zhechong_wan',
    title: '大黄䗪虫丸',
    kind: 'formula',
    comment: CH6 + '：五劳虚极羸瘦，腹满不能饮食……内有干血，肌肤甲错，两目黯黑，缓中补虚，大黄䗪虫丸主之。',
    needs: [
      // 干血劳的三联：消瘦/腹满不能食 + 肌肤甲错 + 两目黯黑
      ['weight_loss.yes', 'skin_scaly.yes'],
      ['skin_scaly.yes', 'eyes_dark_rims.yes'],
      ['weight_loss.yes', 'skin_scaly.yes', 'abdominal_fullness.yes']
    ],
    contraindications: [
      '治「干血劳」：瘦得厉害、肚子胀吃不下，皮肤干得像鱼鳞、眼睛周围发暗',
      '病机是瘀血干结在里（原文「内有干血」），新血生不出来，所以人越来越瘦',
      '方中大黄、䗪虫（土元）、水蛭、虻虫、蛴螬、干漆破血逐瘀，配地黄、芍药、甘草养正',
      '治法是「缓中补虚」——用丸药小量缓攻，寓补于攻，不能峻下',
      '孕妇绝对忌用（破血药极猛）'
    ],
    ref: CH6 + ' · 五劳虚极羸瘦，腹满不能饮食……内有干血，肌肤甲错，两目黯黑，缓中补虚，大黄䗪虫丸主之'
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

  // 小建中汤已有（伤寒 100/102 条），追加虚劳里急那条路径
  const xz = path.join(PLUGINS, 'formulas', 'xiaojianzhong_tang.js')
  let src = fs.readFileSync(xz, 'utf8')
  if (!src.includes('xu_lao.yes')) {
    src = src.replace("['heart_palp.yes', 'restless.yes']",
      "['heart_palp.yes', 'restless.yes'],\n    // 金匮 6.14：虚劳里急，悸、衄，腹中痛，梦失精，四肢酸疼，手足烦热，咽干口燥\n    ['xu_lao.yes', 'abdominal_tension.yes']")
    src = src.replace("'单纯腹胀无痛宜厚朴生姜汤'", "'单纯腹胀无痛宜厚朴生姜汤', '虚劳里急：肚子拘急 + 心悸 + 手足烦热'")
    fs.writeFileSync(xz, src, 'utf8')
    console.log('  ~ 方剂 xiaojianzhong_tang 追加虚劳里急路径')
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  prov.nodes['xiaojianzhong_tang'] = {
    source: 'shanghanlun', label: '伤寒论第100/102条 + 金匮要略第六篇',
    refs: [
      '伤寒论·第100条：伤寒，阳脉涩，阴脉弦，法当腹中急痛，先与小建中汤',
      '伤寒论·第102条：伤寒二三日，心中悸而烦者，小建中汤主之',
      '金匮要略·血痹虚劳病脉证并治第六：虚劳里急，悸、衄，腹中痛，梦失精，四肢酸疼，手足烦热，咽干口燥，小建中汤主之'
    ], by: 'system:jinkui'
  }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + NEW_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂 + 1 追加路径')
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
