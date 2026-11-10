'use strict'
// tools/apply-jingui-zhongfeng.js
// 金匮批 7：第五篇 中风历节病脉证并治（5.1 ~ 5.15）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 5.8 / 5.9 / 5.12 以脉象和治则为主（浮而滑、浮而弱、味酸伤筋），按口径不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH5 = '金匮要略·中风历节病脉证并治第五'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'hemiplegia',
    title: '半身不遂',
    kind: 'symptom',
    comment: CH5 + '：夫风之为病，当半身不遂，或但臂不遂者，此为痹。',
    trigger: ['半身不遂', '半边身子不能动', '半身不随', '一侧肢体不能动', '半边瘫痪',
      '一边身子不听使唤', '半身不能活动'],
    negate: ['两边都能动', '活动自如'],
    ask: '是不是半边身子（手或腿，或者整个一侧）不能动、不听使唤？'
  },
  {
    name: 'one_arm_weak',
    title: '只有一只胳膊抬不起来',
    kind: 'symptom',
    comment: CH5 + '：或但臂不遂者，此为痹（只是单侧上肢不能动，属痹证范围，不是典型中风）。',
    trigger: ['一只胳膊抬不起来', '单侧胳膊不能动', '一个胳膊动不了', '胳膊不听使唤',
      '一只手举不起来', '一侧上肢不能动'],
    negate: ['胳膊活动正常'],
    ask: '是不是只有一只胳膊抬不起来、动不了，身子其他部分还好？'
  },
  {
    name: 'limb_numbness',
    title: '肌肤麻木不仁',
    kind: 'symptom',
    comment: CH5 + '：邪在于络，肌肤不仁。',
    trigger: ['肌肤麻木', '半身麻木', '身上发麻', '手脚发麻没知觉', '皮肤没知觉', '麻木不仁',
      '一侧发麻', '胳膊腿发麻'],
    negate: ['感觉正常', '不发麻'],
    ask: '是不是身上（或某一侧）发麻、木木的，摸上去知觉变迟钝？'
  },
  {
    name: 'limb_heavy_powerless',
    title: '肢体沉重抬不动',
    kind: 'symptom',
    comment: CH5 + '：邪在于经，即重不胜。',
    trigger: ['肢体沉重抬不动', '胳膊腿重得抬不起来', '手脚沉得动不了', '身子重得撑不住',
      '四肢沉重无力', '重得抬不起来'],
    negate: ['活动轻快'],
    ask: '是不是胳膊腿又沉又重，抬起来觉得很费劲、甚至抬不动？'
  },
  {
    name: 'joint_swelling',
    title: '关节肿大',
    kind: 'symptom',
    comment: CH5 + '：诸肢节疼痛，身体魁羸（关节肿大变形）。',
    trigger: ['关节肿大', '关节又肿又大', '关节变形', '手指关节粗大', '膝盖肿得很大',
      '关节肿起来了', '骨节粗大'],
    negate: ['关节不肿'],
    ask: '是不是关节肿大了、看着比正常粗，甚至有点变形？'
  },
  {
    name: 'foot_swelling_drop',
    title: '脚肿得像要掉下来',
    kind: 'symptom',
    comment: CH5 + '：脚肿如脱（两脚浮肿得厉害，沉重得像要脱掉）。',
    trigger: ['脚肿得像要掉', '两脚肿得厉害', '脚肿如脱', '脚背肿得高', '脚肿得发亮',
      '双脚浮肿得厉害', '脚肿得穿不上鞋'],
    negate: ['脚不肿'],
    ask: '是不是两只脚浮肿得厉害，沉甸甸的像要掉下来？'
  },
  {
    name: 'lower_leg_cold',
    title: '小腿发凉',
    kind: 'symptom',
    comment: CH5 + '：身体羸瘦，独足肿大，黄汗出，胫冷。',
    trigger: ['小腿发凉', '胫冷', '小腿冰凉', '脚脖子发凉', '膝盖以下发凉', '小腿老是凉的'],
    negate: ['小腿不凉'],
    ask: '是不是小腿（膝盖以下）老是发凉，摸着比别人冷？'
  },
  {
    name: 'yellow_sweat',
    title: '出黄汗',
    kind: 'symptom',
    comment: CH5 + '：汗出入水中……历节黄汗出；身体羸瘦，独足肿大，黄汗出。',
    trigger: ['出黄汗', '汗是黄的', '汗把衣服染黄', '身上汗发黄', '衣服上汗渍发黄'],
    negate: ['汗不发黄'],
    ask: '是不是出的汗发黄，把内衣、被单染成黄色？'
  },
  {
    name: 'skin_itch_hives',
    title: '身上痒起风团',
    kind: 'symptom',
    comment: CH5 + '：邪气中经，则身痒而瘾疹。',
    trigger: ['身上痒起风团', '身上起风团', '起瘾疹', '皮肤痒起疙瘩', '一挠起一片风团',
      '身上痒痒的起疹子', '荨麻疹'],
    negate: ['身上不痒'],
    ask: '是不是身上发痒，一挠就起一片片风团（荨麻疹）？'
  },
  {
    name: 'self_talk_ceaseless',
    title: '自言自语说个不停',
    kind: 'symptom',
    comment: CH5 + '：防己地黄汤治病如狂状，妄行，独语不休。',
    trigger: ['自言自语说个不停', '一个人在那说话', '独自说个不停', '独语不休',
      '对着空气说话', '自己嘀咕个不停'],
    negate: ['说话正常'],
    ask: '是不是一个人自言自语、说个不停，别人叫也不怎么理？'
  },
  {
    name: 'aimless_walking',
    title: '到处乱走不停',
    kind: 'symptom',
    comment: CH5 + '：妄行（无目的地乱走、停不下来）。',
    trigger: ['到处乱走', '走来走去停不下来', '漫无目的乱走', '妄行', '整天走来走去',
      '乱跑停不住'],
    negate: ['安安静静待着'],
    ask: '是不是漫无目的地到处乱走、走来走去停不下来？'
  },
  {
    name: 'epileptic_seizure',
    title: '抽搐痉挛发作',
    kind: 'symptom',
    comment: CH5 + '：风引汤除热瘫痫（瘫痫：抽搐、癫痫样发作）。',
    trigger: ['抽搐', '抽风', '癫痫发作', '手脚抽筋样抽动', '昏倒抽搐', '痉挛发作',
      '突然倒地抽'],
    negate: ['没有抽搐'],
    ask: '是不是会突然抽搐、抽风，甚至昏倒短暂不省人事？'
  },
  {
    name: 'heart_cold_weak',
    title: '心里发冷、觉得虚',
    kind: 'symptom',
    comment: CH5 + '：侯氏黑散治大风四肢烦重，心中恶寒不足者。',
    trigger: ['心里发冷', '心里觉得冷', '心中恶寒', '心里虚得慌', '心里空落落地发冷',
      '胸口里面发冷'],
    negate: ['心里不冷'],
    ask: '是不是心里（胸口里面）觉得发冷、发虚，没底气？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'zhong_feng',
    title: '中风',
    kind: 'summary',
    comment: CH5 + '：夫风之为病，当半身不遂，或但臂不遂者，此为痹……邪在于络，肌肤不仁；邪在于经，即重不胜。',
    needs: [
      // 半身不遂是中风最典型的表现
      ['hemiplegia.yes'],
      // 半身不遂 + 一侧麻木
      ['hemiplegia.yes', 'limb_numbness.yes'],
      // 半身不遂 + 肢体沉重抬不动
      ['hemiplegia.yes', 'limb_heavy_powerless.yes'],
      // 只一侧胳膊不能动 + 麻木 —— 原文说这偏痹证，但仍属中风范畴的轻浅层次
      ['one_arm_weak.yes', 'limb_numbness.yes']
    ],
    contraindications: [
      '中风的标志是「半身不遂」——半边身子不能动；如果只是单侧胳膊不能动，原文说这偏「痹」，程度轻',
      '原文按邪气深浅分层次：在络（肌肤麻木不仁）→ 在经（肢体沉重抬不动）→ 入腑（神志昏糊不识人）→ 入脏（舌硬说不出话）',
      '「喎僻不遂」指口眼歪斜（嘴和眼睛歪向一侧），是常见伴随表现',
      '病因是正气先虚（络脉空虚），外邪才乘虚而入，不是单纯「受风」'
    ],
    ref: CH5 + ' · 夫风之为病，当半身不遂……邪在于络，肌肤不仁；邪在于经，即重不胜'
  },
  {
    name: 'li_jie_bing',
    title: '历节病',
    kind: 'summary',
    comment: CH5 + '：诸肢节疼痛，身体魁羸，脚肿如脱……历节痛，不可屈伸……病历节不可屈伸，疼痛。',
    needs: [
      // 关节疼得不能屈伸 —— 历节的核心
      ['joint_pain_rigid.yes'],
      // 关节疼 + 关节肿大变形
      ['joint_pain_rigid.yes', 'joint_swelling.yes'],
      // 关节疼 + 脚肿如脱 + 消瘦
      ['joint_pain_rigid.yes', 'foot_swelling_drop.yes', 'weight_loss.yes'],
      // 关节疼 + 出黄汗
      ['joint_pain_rigid.yes', 'yellow_sweat.yes']
    ],
    contraindications: [
      '历节病是关节剧烈疼痛、疼得伸不直弯不下，好比疼痛在关节之间「逐个遍历」，所以叫历节',
      '典型组合：多个关节疼 + 关节肿大变形 + 身体反而瘦弱 + 两脚浮肿得厉害（原文：脚肿如脱）',
      '病因是汗出时受了风冷，或汗出入水，寒湿侵入关节；原文还说「饮酒汗出当风」也是常见诱因',
      '和一般风湿关节痛的区别：历节有明显的关节变形和全身消瘦',
      '主方桂枝芍药知母汤（风湿化热、关节肿痛）和乌头汤（寒湿偏重、剧痛不得屈伸）'
    ],
    ref: CH5 + ' · 诸肢节疼痛，身体魁羸，脚肿如脱……病历节不可屈伸，疼痛'
  },
  {
    name: 'jiao_qi_chong_xin',
    title: '脚气冲心',
    kind: 'summary',
    comment: CH5 + '：矾石汤治脚气冲心。',
    needs: [
      // 脚肿 + 心悸/胸闷气上冲 —— 脚气病水湿上冲犯心的危重阶段
      ['foot_swelling_drop.yes', 'heart_palp.yes'],
      ['foot_swelling_drop.yes', 'short_breath.yes']
    ],
    contraindications: [
      '脚气病起初是脚肿、腿沉，严重时水湿之邪往上冲犯心胸，叫「脚气冲心」',
      '冲到心就会心慌、气短、胸口憋闷，这是危重信号',
      '中医的「脚气」指维生素 B1 缺乏类的湿性脚气（脚肿），不是现在说的脚癣',
      '矾石汤是外洗方（煎水浸脚），用来引湿下行'
    ],
    ref: CH5 + ' · 矾石汤治脚气冲心'
  }
]

// ---------- 方剂 6 个 ----------
const FORMULAS = [
  {
    name: 'houshi_heisan',
    title: '侯氏黑散',
    kind: 'formula',
    comment: CH5 + '：侯氏黑散治大风四肢烦重，心中恶寒不足者。',
    needs: [
      // 四肢沉重 + 心里发冷发虚
      ['limb_heavy_powerless.yes', 'heart_cold_weak.yes'],
      ['body_heavy.yes', 'heart_cold_weak.yes']
    ],
    contraindications: [
      '治「大风」——肢体沉重烦扰、同时心里发冷、觉得虚（正气不足）',
      '方子寒热并用：菊花、防风、细辛祛风，人参、白术、茯苓补气，当归、川芎养血，桔梗、矾石化痰',
      '原法要求用温酒调服，并且忌一切鱼肉大蒜，常宜冷食（让药力在腹中停留）',
      '适合正虚兼风邪的中风轻证，不是急救方'
    ],
    ref: CH5 + ' · 侯氏黑散：治大风四肢烦重，心中恶寒不足者'
  },
  {
    name: 'fengyin_tang',
    title: '风引汤',
    kind: 'formula',
    comment: CH5 + '：风引汤除热瘫痫。',
    needs: [
      // 抽搐 + 发热 —— 「热瘫痫」是热性的抽搐、瘫痪
      ['epileptic_seizure.yes', 'fever.yes'],
      ['epileptic_seizure.yes']
    ],
    contraindications: [
      '治「热瘫痫」——因热而致的抽搐、癫痫样发作，甚至肢体瘫痪',
      '方中重镇药多：龙骨、牡蛎、寒水石、滑石、赤石脂、白石脂、紫石英、石膏，把上冲的热和风往下压',
      '加大黄泻热，甘草调和，是「清热镇惊、潜阳熄风」的思路',
      '偏寒、偏虚的抽搐不适合'
    ],
    ref: CH5 + ' · 风引汤：除热瘫痫'
  },
  {
    name: 'fangji_dihuang_tang',
    title: '防己地黄汤',
    kind: 'formula',
    comment: CH5 + '：防己地黄汤治病如狂状，妄行，独语不休，无寒热，其脉浮。',
    needs: [
      // 自言自语不停 + 到处乱走 + 没有明显寒热
      ['self_talk_ceaseless.yes', 'aimless_walking.yes', 'fever.no'],
      ['self_talk_ceaseless.yes', 'aimless_walking.yes'],
      ['manic.yes', 'self_talk_ceaseless.yes']
    ],
    contraindications: [
      '治一种「像发狂但其实不是实热」的状态：到处乱走、一个人说个不停，可是不发冷也不发热',
      '关键在「无寒热」——没有外感发热，说明是血虚生热、热扰心神，不是阳明实热',
      '生地用量特别大（二斤），配防己、桂枝、防风、甘草，重点在养血清热',
      '和阳明发狂（大承气汤证）区别：那种有腹满硬痛、大便不通、潮热谵语'
    ],
    ref: CH5 + ' · 防己地黄汤：治病如狂状，妄行，独语不休，无寒热，其脉浮'
  },
  {
    name: 'guizhi_shaoyao_zhimu_tang',
    title: '桂枝芍药知母汤',
    kind: 'formula',
    comment: CH5 + '：诸肢节疼痛，身体魁羸，脚肿如脱，头眩短气，温温欲吐，桂枝芍药知母汤主之。',
    needs: [
      ['joint_pain_rigid.yes', 'joint_swelling.yes'],
      ['joint_pain_rigid.yes', 'foot_swelling_drop.yes'],
      ['joint_pain_rigid.yes', 'dizziness.yes', 'short_breath.yes']
    ],
    contraindications: [
      '治历节病偏风湿化热：多个关节疼、关节肿大、身体消瘦、两脚浮肿得厉害，还伴头晕、气短、恶心想吐',
      '桂枝、麻黄、附子温通散寒，芍药、知母清热养阴——寒热并调，因为风湿久郁已经化热',
      '和乌头汤区别：本方偏关节肿大、有热象；乌头汤偏剧痛拘急、寒象明显',
      '附子有毒，须久煎'
    ],
    ref: CH5 + ' · 诸肢节疼痛，身体魁羸，脚肿如脱，头眩短气，温温欲吐，桂枝芍药知母汤主之'
  },
  {
    name: 'wutou_tang',
    title: '乌头汤',
    kind: 'formula',
    comment: CH5 + '：病历节不可屈伸，疼痛，乌头汤主之。乌头汤方：治脚气疼痛，不可屈伸。',
    needs: [
      ['joint_pain_rigid.yes', 'joint_pain_severe.yes'],
      ['joint_pain_rigid.yes', 'lower_leg_cold.yes'],
      ['jiao_qi_pain.yes']
    ],
    contraindications: [
      '治历节病和脚气病，共同点是「疼痛剧烈、关节伸不直弯不下」（不可屈伸）',
      '乌头（川乌）为主药，散寒止痛力量极猛，配麻黄、黄芪、芍药、甘草、白蜜',
      '**乌头有大毒**：必须按原法用蜜煎、久煎，绝不能生用或加量；中毒表现是口舌发麻、心慌、心律不齐',
      '孕妇忌用；服后若唇舌发麻要立即停药就医'
    ],
    ref: CH5 + ' · 病历节不可屈伸，疼痛，乌头汤主之 · 乌头汤方：治脚气疼痛，不可屈伸'
  },
  {
    name: 'fanshi_tang',
    title: '矾石汤',
    kind: 'formula',
    comment: CH5 + '：矾石汤治脚气冲心。',
    needs: [['jiao_qi_chong_xin.yes']],
    contraindications: [
      '治脚气冲心——脚肿严重、水湿上冲引起心慌气短',
      '是**外洗方**：矾石煎水，泡脚浸洗，不是喝的',
      '矾石（白矾）酸涩收敛、燥湿，借浸洗把湿气从下引出',
      '脚气冲心属危重情况，外洗只是辅助，必须及时就医'
    ],
    ref: CH5 + ' · 矾石汤治脚气冲心（矾石二两，以浆水一斗五升，煎三五沸，浸脚良）'
  }
]

// 脚气疼痛单独建一个症状（乌头汤 5.14 用）
const EXTRA_SYMPTOMS = [
  {
    name: 'jiao_qi_pain',
    title: '脚气腿脚疼痛抽急',
    kind: 'symptom',
    comment: CH5 + '：乌头汤方，治脚气疼痛，不可屈伸。',
    trigger: ['脚气疼痛', '腿脚疼痛抽着疼', '小腿抽痛', '脚肿又疼', '腿脚疼得伸不直',
      '脚气腿疼', '两脚疼得走不了'],
    negate: ['腿脚不疼'],
    ask: '是不是腿脚（尤其小腿、脚）疼痛、抽着疼，伸不直？'
  },
  {
    name: 'joint_pain_severe',
    title: '关节痛得剧烈',
    kind: 'symptom',
    comment: CH5 + '：病历节不可屈伸，疼痛，乌头汤主之（乌头汤证以剧痛为主）。',
    trigger: ['关节痛得剧烈', '关节剧痛', '疼得钻心', '疼得受不了', '痛得整夜睡不着',
      '关节疼得直叫', '痛得像被老虎咬'],
    negate: ['疼得不厉害', '只是有点疼'],
    ask: '是不是关节疼得特别剧烈，疼得受不了、晚上都睡不着？'
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
const willExist = new Set(ALL_SYMPTOMS.map(s => s.name).concat(SUMMARIES.map(s => s.name)))
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
  console.log('\n已写入：' + ALL_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂 + provenance')
} else {
  for (const s of ALL_SYMPTOMS) console.log('\n症状 ' + s.name + '（' + s.title + '）｜' + s.ask)
  for (const s of SUMMARIES) {
    console.log('\n证候 ' + s.name + '（' + s.title + '）')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n方剂：')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(14) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
