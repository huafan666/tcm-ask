'use strict'
// tools/apply-jingui-feibing.js
// 金匮批 9：第七篇 肺痿肺痈咳嗽上气病脉证并治（7.1 ~ 7.17）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 7.2 / 7.4 / 7.9 / 7.10 以脉象为主（脉数虚实、脉浮大、脉浮、脉沉）→ 不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH7 = '金匮要略·肺痿肺痈咳嗽上气病脉证并治第七'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'qi_upward_cough',
    title: '咳喘气往上冲',
    kind: 'symptom',
    comment: CH7 + '：咳而上气……咳逆上气……大逆上气（肺气不降，反向上冲逆）。',
    trigger: ['咳喘气往上冲', '咳嗽气往上顶', '咳逆上气', '咳得气往上冲', '气直往上冲',
      '咳嗽气逆', '喘得气往上顶'],
    negate: ['气不上冲'],
    ask: '是不是咳嗽的时候气一个劲往上冲、顶得难受，按都按不住？'
  },
  {
    name: 'throat_rales',
    title: '喉咙里有水鸡叫的声音',
    kind: 'symptom',
    comment: CH7 + '：咳而上气，喉中水鸡声，射干麻黄汤主之（痰阻气道发出的哮鸣音）。',
    trigger: ['喉咙里有水鸡叫', '喉中水鸡声', '喉咙里痰响', '嗓子眼里有拉锯声', '呼吸有哮鸣音',
      '喉咙里呼噜呼噜响', '喘起来嗓子里有声音'],
    negate: ['喉咙没声音'],
    ask: '是不是一咳嗽、一喘，喉咙里就有像水鸡（青蛙）叫一样的痰鸣声？'
  },
  {
    name: 'saliva_spit',
    title: '老吐清水唾沫',
    kind: 'symptom',
    comment: CH7 + '：肺痿吐涎沫而不咳者……多涎唾（吐清稀的涎沫）。',
    trigger: ['老吐清口水', '吐涎沫', '吐清水唾沫', '嘴里老有稀唾沫', '吐白色稀沫',
      '口水多老是吐', '多涎唾'],
    negate: ['不吐唾沫'],
    ask: '是不是嘴里总往外冒清稀的唾沫、口水，得一直吐？'
  },
  {
    name: 'foul_pus_sputum',
    title: '吐腥臭浊痰脓痰',
    kind: 'symptom',
    comment: CH7 + '：时出浊唾腥臭，久久吐脓如米粥者，为肺痈。',
    trigger: ['吐腥臭浊痰', '痰有腥臭味', '吐脓痰', '痰像米粥一样', '咳出腥臭的痰',
      '吐浊唾腥臭', '咳脓痰带臭味', '痰又稠又臭'],
    negate: ['痰不臭'],
    ask: '是不是咳出来的痰又稠又浊，还有腥臭味，甚至像米粥、脓一样？'
  },
  {
    name: 'orthopnea',
    title: '躺不平、只能坐着喘',
    kind: 'symptom',
    comment: CH7 + '：咳逆上气，时时吐浊，但坐不得眠；肺痈，喘不得卧。',
    trigger: ['躺不平', '只能坐着喘', '躺下就喘不上气', '不能平躺', '但坐不得眠',
      '躺下气就上不来', '夜里得坐起来喘', '喘不得卧'],
    negate: ['能平躺'],
    ask: '是不是一躺下就喘不上气，只能坐着或半靠着才舒服？'
  },
  {
    name: 'eye_bulging',
    title: '眼睛胀得像要脱出来',
    kind: 'symptom',
    comment: CH7 + '：咳而上气，此为肺胀，其人喘，目如脱状。',
    trigger: ['眼睛胀得像要脱出来', '眼睛像要掉出来', '目如脱状', '眼睛胀得突出',
      '咳得眼睛往外鼓', '眼球像要脱出'],
    negate: ['眼睛正常'],
    ask: '是不是喘得厉害时，两只眼睛胀得往外鼓、像要脱出来一样？'
  },
  {
    name: 'urine_incontinence',
    title: '小便控制不住',
    kind: 'symptom',
    comment: CH7 + '：肺痿吐涎沫而不咳者……必遗尿，小便数（上虚不能制下）。',
    trigger: ['小便控制不住', '遗尿', '尿裤子', '憋不住尿', '不知不觉尿出来', '小便失禁'],
    negate: ['小便能控制'],
    ask: '是不是小便憋不住、有时不知不觉就尿出来了？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'fei_wei',
    title: '肺痿',
    kind: 'summary',
    comment: CH7 + '：热在上焦者，因咳为肺痿……重亡津液，故得之……肺痿吐涎沫而不咳者，其人不渴，必遗尿，小便数。',
    needs: [
      // 咳 + 吐浊唾涎沫（原文的典型表现）
      ['cough.yes', 'saliva_spit.yes'],
      // 吐涎沫 + 不渴 + 遗尿（肺中冷的虚寒型）
      ['saliva_spit.yes', 'thirsty.no', 'urine_incontinence.yes'],
      // 吐涎沫 + 小便频
      ['saliva_spit.yes', 'frequent_urination.yes']
    ],
    contraindications: [
      '肺痿是肺叶「痿弱不用」——肺的功能虚衰了，不是实证',
      '典型表现：咳、吐出浊唾涎沫；虚寒型的甚至不太咳、口不渴、还遗尿、小便次数多',
      '成因原文说得很清楚：汗出太多、呕吐、消渴小便多、便秘又误用泻药，这几种都在「重亡津液」，津液伤透了肺就痿了',
      '虚寒型（肺中冷）用甘草干姜汤温肺；虚热型是麦门冬汤的方向',
      '和肺痈的区别：肺痿吐的是清稀涎沫，肺痈吐的是腥臭脓痰'
    ],
    ref: CH7 + ' · 热在上焦者，因咳为肺痿……肺痿吐涎沫而不咳者，其人不渴，必遗尿'
  },
  {
    name: 'fei_yong',
    title: '肺痈',
    kind: 'summary',
    comment: CH7 + '：咳而胸满，振寒脉数，咽干不渴，时出浊唾腥臭，久久吐脓如米粥者，为肺痈。',
    needs: [
      // 咳 + 吐腥臭浊痰脓痰 —— 肺痈的定性表现
      ['cough.yes', 'foul_pus_sputum.yes'],
      // 咳 + 胸满 + 吐脓
      ['cough.yes', 'chest_fullness.yes', 'foul_pus_sputum.yes'],
      // 喘不得卧 + 吐脓
      ['orthopnea.yes', 'foul_pus_sputum.yes']
    ],
    contraindications: [
      '肺痈是肺里生了痈脓，属热毒壅肺、血败肉腐',
      '关键特征：咳吐腥臭浊痰，拖久了吐出来像米粥一样的脓',
      '常伴怕冷打寒战、胸满、咽干但不渴（热在肺不在胃，所以不渴）',
      '分期：初起（表证期）→ 成痈期 → 溃脓期 → 恢复期，不同阶段用方不同',
      '和肺痿的区别：肺痿吐清稀涎沫、属虚；肺痈吐腥臭脓痰、属实热'
    ],
    ref: CH7 + ' · 咳而胸满，振寒脉数，咽干不渴，时出浊唾腥臭，久久吐脓如米粥者，为肺痈'
  },
  {
    name: 'fei_zhang',
    title: '肺胀',
    kind: 'summary',
    comment: CH7 + '：上气喘而躁者，属肺胀……咳而上气，此为肺胀，其人喘，目如脱状……肺胀，咳而上气，烦躁而喘。',
    needs: [
      // 咳喘气上冲 + 烦躁
      ['qi_upward_cough.yes', 'restless.yes'],
      // 咳喘气上冲 + 眼睛胀得像要脱出
      ['qi_upward_cough.yes', 'eye_bulging.yes'],
      // 咳喘气上冲 + 躺不平
      ['qi_upward_cough.yes', 'orthopnea.yes']
    ],
    contraindications: [
      '肺胀是肺气胀满、不能肃降，表现为咳喘、气往上冲、胸闷胀得厉害',
      '严重时喘得眼睛往外鼓、像要脱出来（原文：目如脱状），只能坐着不能平躺',
      '常伴烦躁（原文：喘而躁者），因为气机壅滞、郁而化热',
      '病机是「心下有水」——水饮内停 + 外邪束表，肺气不得宣降',
      '和一般咳嗽的区别：肺胀有明显的胸中胀满感和呼吸窘迫'
    ],
    ref: CH7 + ' · 上气喘而躁者，属肺胀……咳而上气，此为肺胀，其人喘，目如脱状'
  }
]

// ---------- 方剂 ----------
const FORMULAS = [
  {
    name: 'gancao_ganjiang_tang',
    title: '甘草干姜汤',
    kind: 'formula',
    comment: CH7 + '：肺痿吐涎沫而不咳者，其人不渴，必遗尿，小便数……此为肺中冷，必眩，多涎唾，甘草干姜汤以温之。',
    needs: [
      // 吐涎沫 + 口不渴（虚寒的关键：不渴）
      ['saliva_spit.yes', 'thirsty.no'],
      ['saliva_spit.yes', 'urine_incontinence.yes']
    ],
    contraindications: [
      '治虚寒型肺痿：吐清稀涎沫、口不渴、遗尿、小便次数多',
      '只有炙甘草 + 干姜两味，温肺复气——肺中冷了，用干姜温、甘草补',
      '「其人不渴」是关键鉴别：口渴说明有热，就不能用这个温法',
      '原文还提醒：吃完药如果反而口渴了，那是转成消渴了，要换方向'
    ],
    ref: CH7 + ' · 此为肺中冷，必眩，多涎唾，甘草干姜汤以温之'
  },
  {
    name: 'shegan_mahuang_tang',
    title: '射干麻黄汤',
    kind: 'formula',
    comment: CH7 + '：咳而上气，喉中水鸡声，射干麻黄汤主之。',
    needs: [
      // 咳 + 喉中痰鸣（水鸡声）—— 本方最特异的靶点
      ['cough.yes', 'throat_rales.yes'],
      ['qi_upward_cough.yes', 'throat_rales.yes']
    ],
    contraindications: [
      '治「咳而上气、喉中水鸡声」——咳嗽气逆，喉咙里有像水鸡（青蛙）叫的痰鸣音',
      '射干消痰利咽、麻黄宣肺平喘，配生姜、细辛、半夏温化寒痰，紫菀、款冬止咳，五味子收敛',
      '偏寒痰、痰多清稀的哮鸣，不是热痰',
      '原文服法是「先煮麻黄两沸，去上沫」，减少麻黄的发汗副作用'
    ],
    ref: CH7 + ' · 咳而上气，喉中水鸡声，射干麻黄汤主之'
  },
  {
    name: 'zaojia_wan',
    title: '皂荚丸',
    kind: 'formula',
    comment: CH7 + '：咳逆上气，时时吐浊，但坐不得眠，皂荚丸主之。',
    needs: [
      // 躺不平 + 老吐稠浊痰
      ['orthopnea.yes', 'foul_pus_sputum.yes'],
      ['orthopnea.yes', 'qi_upward_cough.yes']
    ],
    contraindications: [
      '治痰浊壅盛：咳逆气上、不停地吐稠浊的痰，一躺下就受不了，只能坐着',
      '皂荚一味，做成梧桐子大的小丸，用枣膏（大枣煮烂）和汤送服',
      '皂荚涤痰力猛，用枣膏护胃、缓和药性，是「峻药缓用」的典型',
      '虚弱的人、孕妇慎用；中病即止，不可久服'
    ],
    ref: CH7 + ' · 咳逆上气，时时吐浊，但坐不得眠，皂荚丸主之'
  },
  {
    name: 'houpo_mahuang_tang',
    title: '厚朴麻黄汤',
    kind: 'formula',
    comment: CH7 + '：咳而脉浮者，厚朴麻黄汤主之。',
    needs: [
      // 咳嗽 + 胸满（脉浮原文不做，用「胸满」承接病位偏上偏表）
      ['cough.yes', 'chest_fullness.yes', 'fever.no'],
      ['cough.yes', 'chest_fullness.yes']
    ],
    contraindications: [
      '治咳嗽而病位偏上偏表（原文以「脉浮」定位，脉象按口径不入条件，改以胸满作代理）',
      '厚朴降气宽胸、麻黄宣肺，配石膏清郁热，杏仁、半夏、干姜、细辛、五味子化饮止咳，小麦养正',
      '偏寒饮郁热、胸闷咳嗽的证型'
    ],
    ref: CH7 + ' · 咳而脉浮者，厚朴麻黄汤主之'
  },
  {
    name: 'zeqi_tang',
    title: '泽漆汤',
    kind: 'formula',
    comment: CH7 + '：脉沉者，泽漆汤主之。',
    needs: [
      // 咳嗽 + 躺不平/水肿样表现（脉沉说明病位偏里，用「躺不平」承接里饮）
      ['cough.yes', 'orthopnea.yes'],
      ['cough.yes', 'chest_fullness.yes', 'frequent_urination.yes']
    ],
    contraindications: [
      '治水饮内停、病位偏里（原文以「脉沉」定位，脉象按口径不入条件）',
      '泽漆逐水消肿为君，配半夏、生姜、桂枝、紫参、白前、甘草、人参——逐水同时护正',
      '原文用东流水先煮泽漆取汁再煎他药，取长流水助下行之性'
    ],
    ref: CH7 + ' · 脉沉者，泽漆汤主之'
  },
  {
    name: 'maimendong_tang',
    title: '麦门冬汤',
    kind: 'formula',
    comment: CH7 + '：大逆上气，咽喉不利，止逆下气者，麦门冬汤主之。',
    needs: [
      // 气逆上冲 + 咽喉不利（干涩不适）
      ['qi_upward_cough.yes', 'throat_dry.yes'],
      ['qi_upward_cough.yes', 'cough.yes', 'throat_dry.yes']
    ],
    contraindications: [
      '治「大逆上气、咽喉不利」——气往上冲得厉害，同时嗓子干涩不舒服',
      '病机是肺胃阴伤、虚火上逆，所以用麦门冬（用量极大，七升）滋养肺胃',
      '配半夏化痰降逆、人参甘草粳米大枣补中，是「补中有降」',
      '和射干麻黄汤区别：那条是寒痰实邪（喉中水鸡声），本方是阴虚（咽喉干涩）'
    ],
    ref: CH7 + ' · 大逆上气，咽喉不利，止逆下气者，麦门冬汤主之'
  },
  {
    name: 'tingli_dazao_xiefei_tang',
    title: '葶苈大枣泻肺汤',
    kind: 'formula',
    comment: CH7 + '：肺痈，喘不得卧，葶苈大枣泻肺汤主之。',
    needs: [
      // 喘 + 躺不平（肺痈成痈期、痰涎壅盛）
      ['orthopnea.yes', 'cough.yes'],
      ['orthopnea.yes', 'foul_pus_sputum.yes'],
      ['fei_yong.yes', 'orthopnea.yes']
    ],
    contraindications: [
      '治肺痈「喘不得卧」——痰涎壅塞肺中，一躺下就喘不上气',
      '葶苈子泻肺逐痰、开泄肺气，大枣护脾胃、防泻下太过',
      '「泻肺」不是「泻下」：目的是把壅塞在肺里的痰浊排掉',
      '体虚的人慎用，中病即止'
    ],
    ref: CH7 + ' · 肺痈，喘不得卧，葶苈大枣泻肺汤主之'
  },
  {
    name: 'yuebi_jia_banxia_tang',
    title: '越婢加半夏汤',
    kind: 'formula',
    comment: CH7 + '：咳而上气，此为肺胀，其人喘，目如脱状，脉浮大者，越婢加半夏汤主之。',
    needs: [
      // 咳喘气上冲 + 眼睛胀得像要脱出 —— 原文最特异的体征
      ['qi_upward_cough.yes', 'eye_bulging.yes'],
      ['eye_bulging.yes', 'orthopnea.yes']
    ],
    contraindications: [
      '治肺胀重证：咳喘气逆、喘得眼睛往外鼓像要脱出',
      '越婢汤（麻黄、石膏、生姜、大枣、甘草）宣肺泄热 + 半夏降逆化痰',
      '属饮热壅肺、偏热的肺胀；脉浮大说明邪仍在表，脉象按口径不入条件',
      '和越婢汤本证区别：本方多有咳喘、目如脱状的闷胀感'
    ],
    ref: CH7 + ' · 咳而上气，此为肺胀，其人喘，目如脱状，脉浮大者，越婢加半夏汤主之'
  },
  {
    name: 'xiaoqinglong_jia_shigao_tang',
    title: '小青龙加石膏汤',
    kind: 'formula',
    comment: CH7 + '：肺胀，咳而上气，烦躁而喘，脉浮者，心下有水，小青龙加石膏汤主之。',
    needs: [
      // 咳喘气上冲 + 烦躁（寒饮郁久化热的关键指征）
      ['qi_upward_cough.yes', 'restless.yes'],
      ['qi_upward_cough.yes', 'restless.yes', 'throat_rales.yes']
    ],
    contraindications: [
      '治肺胀而「烦躁」——本来是寒饮（小青龙证），郁久了化出热来，所以烦躁',
      '小青龙汤（麻黄、桂枝、细辛、干姜、半夏、五味子、芍药、甘草）温化寒饮 + 石膏清郁热',
      '「烦躁」是加石膏的指征，没有烦躁就单纯用小青龙汤',
      '和越婢加半夏汤区别：本条以寒饮为主兼郁热（有烦躁），越婢加半夏偏饮热壅盛（目如脱状）'
    ],
    ref: CH7 + ' · 肺胀，咳而上气，烦躁而喘，脉浮者，心下有水，小青龙加石膏汤主之'
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

  // 桔梗汤已有（伤寒 311 条少阴咽痛），追加肺痈排脓那条路径
  const jg = path.join(PLUGINS, 'formulas', 'jiegeng_tang.js')
  let jsrc = fs.readFileSync(jg, 'utf8')
  if (!jsrc.includes('fei_yong.yes')) {
    jsrc = jsrc.replace("['throat_pain.yes', 'diarrhea.no']",
      "['throat_pain.yes', 'diarrhea.no'],\n    // 金匮 7.13：咳而胸满……时出浊唾腥臭，久久吐脓如米粥者，为肺痈，桔梗汤主之\n    ['fei_yong.yes', 'foul_pus_sputum.yes']")
    jsrc = jsrc.replace("'咽痛兼下利用猪肤'", "'咽痛兼下利用猪肤', '肺痈溃脓期排脓（金匮 7.13）'")
    fs.writeFileSync(jg, jsrc, 'utf8')
    console.log('  ~ 方剂 jiegeng_tang 追加肺痈排脓路径')
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  prov.nodes['jiegeng_tang'] = {
    source: 'shanghanlun', label: '伤寒论第311条 + 金匮要略第七篇',
    refs: [
      '伤寒论·第311条：少阴病二三日，咽痛者，可与甘草汤；不差者，与桔梗汤',
      '金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳而胸满，振寒脉数，咽干不渴，时出浊唾腥臭，久久吐脓如米粥者，为肺痈，桔梗汤主之'
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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(16) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
