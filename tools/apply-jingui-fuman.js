'use strict'
// tools/apply-jingui-fuman.js
// 金匮批 12：第十篇 腹满寒疝宿食病脉证并治（10.1 ~ 10.21）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 10.1 / 10.5 / 10.21 是脉象条；10.4 是死证断语；10.6 / 10.7 是中寒轻证描述（无方）→ 均不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH10 = '金匮要略·腹满寒疝宿食病脉证并治第十'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'circumumbilical_pain',
    title: '肚脐周围痛',
    kind: 'symptom',
    comment: CH10 + '：夫瘦人绕脐痛，必有风冷……寒疝绕脐痛。',
    trigger: ['肚脐周围痛', '绕脐痛', '绕着肚脐一圈痛', '肚脐眼周围疼', '脐周疼痛',
      '肚脐四周痛'],
    negate: ['肚脐周围不痛'],
    ask: '是不是疼在肚脐周围、绕着肚脐一圈？'
  },
  {
    name: 'abdomen_bulging_mass',
    title: '肚子上鼓起一块像有头有脚',
    kind: 'symptom',
    comment: CH10 + '：上冲皮起，出见有头足（腹中寒气攻冲，肚皮鼓起可移动的块）。',
    trigger: ['肚子鼓起一块', '肚皮上鼓起像有头有脚', '腹中鼓起硬块会动', '肚子上鼓包',
      '皮下鼓起一块上下走', '肚子鼓起来像有东西在顶'],
    negate: ['肚子不鼓包'],
    ask: '是不是肚子上鼓起一块，形状像有头有脚，还会上下移动？'
  },
  {
    name: 'cold_sweat',
    title: '出冷汗',
    kind: 'symptom',
    comment: CH10 + '：寒疝绕脐痛，若发则白汗出（白汗＝冷汗、痛极而出）。',
    trigger: ['出冷汗', '白汗出', '疼得冒冷汗', '一阵冷汗', '冷汗直冒', '身上发凉还出汗'],
    negate: ['不出冷汗'],
    ask: '是不是疼起来会出一身冷汗，身上还是凉的？'
  },
  {
    name: 'hypochondriac_side_pain',
    title: '一侧胁肋痛',
    kind: 'symptom',
    comment: CH10 + '：胁下偏痛，发热，其脉紧弦，此寒也（偏于一侧的胁下痛）。',
    trigger: ['一侧胁肋痛', '胁下偏痛', '单侧肋骨下痛', '只有一边胁下疼', '左胁下痛',
      '右胁下痛', '一边肋巴骨下痛'],
    negate: ['胁肋不痛'],
    ask: '是不是只有一侧（左或右）肋骨下面痛？'
  },
  {
    name: 'epigastric_pressing_pain',
    title: '心口按下去又满又痛',
    kind: 'symptom',
    comment: CH10 + '：按之心下满痛者，此为实也（按之满痛是实证的标志）。',
    trigger: ['心口按下去又满又痛', '心下满痛', '按之心下满痛', '心口一按就痛还发满',
      '胃这块按着满痛', '心口压着又胀又疼'],
    negate: ['心口按着不痛'],
    ask: '是不是心口（胃这块）又胀满又痛，一按下去更明显？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'fu_man',
    title: '腹满',
    kind: 'summary',
    comment: CH10 + '：病者腹满，按之不痛为虚，痛者为实，可下之……腹满时减，复如故，此为寒，当与温药……腹满不减，减不足言，当须下之。',
    needs: [
      // 腹满 + 按之痛（实证）
      ['abdominal_fullness.yes', 'abdominal_pain.yes'],
      // 腹满 + 痛得不敢碰（实热壅盛）
      ['abdominal_fullness.yes', 'severe_abdominal_pain.yes'],
      // 腹满 + 怕冷（虚寒）
      ['abdominal_fullness.yes', 'cold_aversion.yes']
    ],
    contraindications: [
      '腹满要分虚实，原文给了最实用的手法：**按之不痛是虚，按之痛是实**',
      '实证可以用下法（大黄、厚朴、枳实之类）；虚寒证要用温药，不能用下法',
      '原文还给了寒证的判据：「腹满时减，复如故」——胀满一会儿轻、一会儿又恢复原样，说明是寒气，当用温药',
      '反过来「腹满不减，减不足言」——胀满一直不消、稍微轻一点也等于没轻，那是实证壅结，必须下',
      '「舌黄未下者，下之黄自去」——舌苔黄是里实热的指征，泻下之后黄苔会自然退掉'
    ],
    ref: CH10 + ' · 病者腹满，按之不痛为虚，痛者为实，可下之'
  },
  {
    name: 'han_shan',
    title: '寒疝',
    kind: 'summary',
    comment: CH10 + '：腹痛，脉弦而紧……恶寒，紧则不欲食，邪正相搏，即为寒疝。寒疝绕脐痛，若发则白汗出，手足厥冷。',
    needs: [
      // 腹痛 + 怕冷 + 不想吃饭（原文三要素）
      ['abdominal_pain.yes', 'cold_aversion.yes', 'low_appetite.yes'],
      // 绕脐痛 + 出冷汗
      ['circumumbilical_pain.yes', 'cold_sweat.yes'],
      // 腹痛 + 手足冰冷
      ['abdominal_pain.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '寒疝不是现代说的「疝气」——它是**阴寒内盛引起的剧烈腹痛**，痛起来绕肚脐一圈',
      '发作时的样子：疼得出一身冷汗（原文叫「白汗出」）、手脚冰凉（手足厥冷）',
      '病机是「邪正相搏」——阴寒之邪与正气在里相争，所以又痛又怕冷又不想吃饭',
      '和治疗疝气（小茴香、橘核之类理气）完全不是一回事，这里要用大辛大热温散',
      '⚠ 这种剧烈腹痛同样要排除急腹症（肠梗阻、胰腺炎、阑尾炎等），别只顾温阳'
    ],
    ref: CH10 + ' · 腹痛，脉弦而紧……邪正相搏，即为寒疝'
  }
]

// ---------- 方剂 9 个（新建） ----------
const FORMULAS = [
  {
    name: 'houpo_qi_wu_tang',
    title: '厚朴七物汤',
    kind: 'formula',
    comment: CH10 + '：病腹满，发热十日，脉浮而数，饮食如故，厚朴七物汤主之。',
    needs: [
      // 腹满 + 发热 + 还能吃饭（里实还不太重）
      ['abdominal_fullness.yes', 'fever.yes', 'low_appetite.no'],
      ['abdominal_fullness.yes', 'fever.yes']
    ],
    contraindications: [
      '治腹满同时还有发热（表邪未解 + 里已胀满），关键是「饮食如故」——还能吃得下，说明里实不重',
      '组成是桂枝汤去芍药 + 厚朴三物汤（厚朴、枳实、大黄）——表里双解，一面解表一面除满',
      '和厚朴三物汤的区别：厚朴三物汤只管里实胀满（痛而闭），没有发热表证',
      '脉浮数是表邪未尽的指征（脉象按口径不入条件）'
    ],
    ref: CH10 + ' · 病腹满，发热十日，脉浮而数，饮食如故，厚朴七物汤主之'
  },
  {
    name: 'fuzi_jingmi_tang',
    title: '附子粳米汤',
    kind: 'formula',
    comment: CH10 + '：腹中寒气，雷鸣切痛，胸胁逆满，呕吐，附子粳米汤主之。',
    needs: [
      // 腹中雷鸣 + 剧痛 + 呕吐 —— 原文三要素
      ['borborygmus.yes', 'severe_abdominal_pain.yes', 'vomiting.yes'],
      ['borborygmus.yes', 'vomiting.yes', 'cold_aversion.yes']
    ],
    contraindications: [
      '治腹中寒气：肚子咕噜响、绞痛（雷鸣切痛）、胸胁胀满气逆、呕吐',
      '附子温阳散寒，半夏降逆止呕，甘草、大枣、粳米补中缓急',
      '重点在「寒气」——一定伴随怕冷、腹部发凉',
      '附子有毒须炮制久煎'
    ],
    ref: CH10 + ' · 腹中寒气，雷鸣切痛，胸胁逆满，呕吐，附子粳米汤主之'
  },
  {
    name: 'houpo_san_wu_tang',
    title: '厚朴三物汤',
    kind: 'formula',
    comment: CH10 + '：痛而闭者，厚朴三物汤主之。',
    needs: [
      // 腹痛 + 大便不通（「痛而闭」）
      ['abdominal_pain.yes', 'constipation.yes'],
      ['abdominal_fullness.yes', 'constipation.yes', 'abdominal_pain.yes']
    ],
    contraindications: [
      '治「痛而闭」——肚子痛 + 大便不通。两个条件就是全部',
      '厚朴、枳实、大黄三味，但**厚朴用量最重**（八两）——重点在行气除满，不是单纯泻下',
      '和小承气汤（大黄、厚朴、枳实）的区别：药味相同但剂量不同，小承气重在泻热通便，厚朴三物汤重在行气消满',
      '和厚朴七物汤区别：本方无发热表证'
    ],
    ref: CH10 + ' · 痛而闭者，厚朴三物汤主之'
  },
  {
    name: 'dajianzhong_tang',
    title: '大建中汤',
    kind: 'formula',
    comment: CH10 + '：心胸中大寒痛，呕不能饮食，腹中满，上冲皮起，出见有头足，上下痛而不可触近，大建中汤主之。',
    needs: [
      // 腹中隆起如头足 + 痛得不敢碰 —— 本方最特异的体征
      ['abdomen_bulging_mass.yes', 'severe_abdominal_pain.yes'],
      ['abdomen_bulging_mass.yes', 'vomiting.yes'],
      ['severe_abdominal_pain.yes', 'vomiting.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治「大寒痛」：心胸腹部剧烈冷痛，呕吐得吃不下，肚子胀满',
      '最形象的一句话是「上冲皮起，出见有头足」——寒气攻冲时肚皮鼓起一块、形状像有头有脚，还会上下移动',
      '「不可触近」——痛得连碰都不让碰，是寒气极盛的表现',
      '蜀椒、干姜大辛大热温中散寒，人参、饴糖补中缓急；原文要求「分温再服」，且服后「当一日食糜」——当天只吃稀粥',
      '⚠ 这种剧痛伴腹部包块，必须先排除肠梗阻、肠套叠等急腹症'
    ],
    ref: CH10 + ' · 心胸中大寒痛，呕不能饮食，腹中满，上冲皮起，出见有头足，上下痛而不可触近，大建中汤主之'
  },
  {
    name: 'dahuang_fuzi_tang',
    title: '大黄附子汤',
    kind: 'formula',
    comment: CH10 + '：胁下偏痛，发热，其脉紧弦，此寒也，以温药下之，宜大黄附子汤。',
    needs: [
      // 一侧胁下痛 + 便秘（寒实内结，需要温下）
      ['hypochondriac_side_pain.yes', 'constipation.yes'],
      ['hypochondriac_side_pain.yes', 'abdominal_pain.yes', 'cold_aversion.yes']
    ],
    contraindications: [
      '治「寒实内结」：一侧胁下痛、发热、大便秘结，但病性是**寒**不是热',
      '关键在「以温药下之」——用大黄泻下，同时配附子、细辛温散寒邪，这叫「温下法」',
      '和承气汤类（寒下）的区别：那种是热结（喜冷饮、舌黄），本方是寒结（怕冷、脉紧弦）',
      '附子有毒须久煎；服后大便通即停'
    ],
    ref: CH10 + ' · 胁下偏痛，发热，其脉紧弦，此寒也，以温药下之，宜大黄附子汤'
  },
  {
    name: 'chi_wan',
    title: '赤丸',
    kind: 'formula',
    comment: CH10 + '：寒气厥逆，赤丸主之。',
    needs: [
      // 四肢冰冷 + 腹痛（寒气厥逆）
      ['cold_extremities.yes', 'abdominal_pain.yes'],
      ['cold_extremities.yes', 'circumumbilical_pain.yes']
    ],
    contraindications: [
      '治「寒气厥逆」——阴寒内盛导致四肢冰冷，同时伴腹痛',
      '茯苓、半夏化饮降逆，乌头、细辛温散沉寒，朱砂（原方用真朱）镇逆安神',
      '**乌头有毒**，做成蜜丸小量服（如麻子大，先食酒下三丸），须严格按原法',
      '朱砂含汞，现代多不入内服，须谨慎',
      '原文说「不知，稍增之，以知为度」——见效就停，不能一直加量'
    ],
    ref: CH10 + ' · 寒气厥逆，赤丸主之'
  },
  {
    name: 'dawutou_jian',
    title: '大乌头煎',
    kind: 'formula',
    comment: CH10 + '：寒疝绕脐痛，若发则白汗出，手足厥冷，其脉沉紧者，大乌头煎主之。',
    needs: [
      // 寒疝三要素：绕脐痛 + 冷汗 + 手足厥冷
      ['circumumbilical_pain.yes', 'cold_sweat.yes', 'cold_extremities.yes'],
      ['han_shan.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治寒疝重证：绕脐剧痛、疼得冒冷汗、手脚冰凉',
      '只有乌头一味，加蜜久煎——「乌头五枚，以水三升，煮取一升，去滓，内蜜二升，煎令水气尽」',
      '**乌头大毒**：必须用蜜煎到「水气尽」以减毒，绝不可生用或自行加量',
      '原文警告「强人服七合，弱人服五合。不差，明日更服，不可一日再服」——一天只能服一次',
      '中毒表现：唇舌四肢发麻、心慌、心律不齐、血压下降，须立即就医；孕妇绝对忌用'
    ],
    ref: CH10 + ' · 寒疝绕脐痛，若发则白汗出，手足厥冷，其脉沉紧者，大乌头煎主之'
  },
  {
    name: 'dangui_shengjiang_yangrou_tang',
    title: '当归生姜羊肉汤',
    kind: 'formula',
    comment: CH10 + '：寒疝腹中痛，及胁痛里急者，当归生姜羊肉汤主之。',
    needs: [
      // 腹中痛 + 拘急（里急）+ 偏虚寒
      ['abdominal_pain.yes', 'abdominal_tension.yes'],
      ['abdominal_pain.yes', 'hypochondriac_side_pain.yes']
    ],
    contraindications: [
      '治虚寒性腹痛：腹中痛、胁痛、肚子拘急发紧（里急）',
      '只有三味，而且**羊肉是食材**——当归养血、生姜温中、羊肉温补，是药食同源的温补方',
      '适合血虚有寒的腹痛：疼得绵绵不休、喜温喜按、面色淡',
      '和附子粳米汤、大建中汤区别：那些是寒实剧痛急着温散，本方是虚寒隐痛，温和温补',
      '实热腹痛、阴虚有热者不宜'
    ],
    ref: CH10 + ' · 寒疝腹中痛，及胁痛里急者，当归生姜羊肉汤主之'
  },
  {
    name: 'wutou_guizhi_tang',
    title: '抵当乌头桂枝汤',
    kind: 'formula',
    comment: CH10 + '：寒疝腹中痛，逆冷，手足不仁，若身疼痛，灸刺诸药不能治，抵当乌头桂枝汤主之。',
    needs: [
      // 腹痛 + 手足冰冷不仁 + 身疼痛
      ['abdominal_pain.yes', 'cold_extremities.yes', 'body_pain.yes'],
      ['abdominal_pain.yes', 'limb_numbness.yes']
    ],
    contraindications: [
      '治寒疝而**表里同病**：腹中痛（里寒）+ 四肢逆冷、手足麻木不仁 + 身体疼痛（表寒）',
      '「灸刺诸药不能治」——说明病情顽固，一般方法都试过了',
      '组成是乌头 + 桂枝汤：乌头温里散寒，桂枝汤调和营卫解表',
      '**乌头大毒**，须蜜煎；原文服法特意叮嘱「初服二合，不知，即服三合，又不知，复加至五合」——一点点试，' +
      '「其知者，如醉状，得吐者为中病」——出现像喝醉、想吐的反应说明药已中病，**必须立即停服**',
      '孕妇绝对忌用'
    ],
    ref: CH10 + ' · 寒疝腹中痛，逆冷，手足不仁，若身疼痛，灸刺诸药不能治，抵当乌头桂枝汤主之'
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

  // 大柴胡汤（10.12：按之心下满痛此为实也）
  const dc = path.join(PLUGINS, 'formulas', 'dachaihu_tang.js')
  let s1 = fs.readFileSync(dc, 'utf8')
  if (!s1.includes('epigastric_pressing_pain.yes')) {
    s1 = s1.replace("['low_appetite.yes', 'epigastric_fullness.yes', 'restless.yes']",
      "['low_appetite.yes', 'epigastric_fullness.yes', 'restless.yes'],\n" +
      "    // 金匮 10.12：按之心下满痛者，此为实也，当下之，宜大柴胡汤\n" +
      "    ['epigastric_pressing_pain.yes', 'constipation.yes'],\n" +
      "    ['epigastric_pressing_pain.yes', 'fever.yes']")
    fs.writeFileSync(dc, s1, 'utf8')
    console.log('  ~ 方剂 dachaihu_tang 追加心下按之满痛路径')
  }

  // 大承气汤（10.13：腹满不减，减不足言，当须下之）
  const dch = path.join(PLUGINS, 'formulas', 'dachengqi_tang.js')
  let s2 = fs.readFileSync(dch, 'utf8')
  if (!s2.includes('abdominal_fullness.yes')) {
    s2 = s2.replace("['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes']",
      "['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes'],\n" +
      "    // 金匮 10.13：腹满不减，减不足言，当须下之，宜大承气汤（腹满持续不消＝里实壅结）\n" +
      "    ['abdominal_fullness.yes', 'severe_abdominal_pain.yes']")
    fs.writeFileSync(dch, s2, 'utf8')
    console.log('  ~ 方剂 dachengqi_tang 追加腹满不减路径')
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + NEW_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂 + 2 追加路径')
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
