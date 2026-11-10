'use strict'
// tools/apply-jingui-tanyin.js
// 金匮批 14：第十二篇 痰饮咳嗽病脉证并治（12.1 ~ 12.32）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 12.13 / 12.14 / 12.15 / 12.20 / 12.21 / 12.22 是脉象条 → 不落节点
// 12.3 ~ 12.7（水在五脏）、12.8 ~ 12.12（留饮伏饮）、12.16（治则）→ 病机条，不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH12 = '金匮要略·痰饮咳嗽病脉证并治第十二'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'cough_pleuritic_pain',
    title: '咳嗽时胁下牵扯痛',
    kind: 'symptom',
    comment: CH12 + '：饮后水流在胁下，咳唾引痛，谓之悬饮。',
    trigger: ['咳嗽时胁下牵扯痛', '咳唾引痛', '一咳胁下就痛', '咳嗽扯着胁下疼',
      '咳一下肋骨下就疼', '咳嗽时牵引着痛'],
    negate: ['咳嗽不牵扯痛'],
    ask: '是不是一咳嗽，两侧肋骨下面就牵扯着痛？'
  },
  {
    name: 'back_cold_patch',
    title: '背部一块发冷',
    kind: 'symptom',
    comment: CH12 + '：夫心下有留饮，其人背寒冷如手大。',
    trigger: ['背部一块发冷', '背寒冷如手大', '背上有一块老是凉的', '后背一块冰凉',
      '背部一块像巴掌大小发冷', '背上巴掌大一块冷'],
    negate: ['背部不发冷'],
    ask: '是不是背上有一块（大约巴掌大小）老是发冷？'
  },
  {
    name: 'tearing_eyes',
    title: '眼泪自己流出来',
    kind: 'symptom',
    comment: CH12 + '：膈上病痰，满喘咳吐，发则寒热……目泣自出。',
    trigger: ['眼泪自己流出来', '目泣自出', '不自觉流泪', '咳得眼泪直流',
      '眼睛老是自己流泪', '一咳就流泪'],
    negate: ['不流泪'],
    ask: '是不是没哭，眼泪却自己流出来（尤其咳得厉害时）？'
  }
]

// ---------- 四饮证候 ----------
const SUMMARIES = [
  {
    name: 'tan_yin',
    title: '痰饮',
    kind: 'summary',
    comment: CH12 + '：其人素盛今瘦，水走肠间，沥沥有声，谓之痰饮。',
    needs: [
      // 素盛今瘦 + 肠间沥沥有声 —— 原文的痰饮定义
      ['weight_loss.yes', 'borborygmus.yes'],
      ['borborygmus.yes', 'body_heavy.yes'],
      ['borborygmus.yes', 'chest_qi_stuffiness.yes']
    ],
    contraindications: [
      '四饮之一。痰饮的定义是「素盛今瘦，水走肠间，沥沥有声」——原来胖、现在瘦了，肚子里咕噜咕噜响',
      '关键在水停在**胃肠**，所以表现是肠鸣、消瘦、身体沉重',
      '治则原文给了一句话：「病痰饮者，当以温药和之」——痰饮属阴邪，要用温药慢慢化解，不能猛攻',
      '和悬饮（水在胁下）、溢饮（水在四肢）、支饮（水在胸膈）的部位不同',
      '⚠ 中医的「痰饮」是水液代谢失常的产物，不等于西医的「痰」'
    ],
    ref: CH12 + ' · 其人素盛今瘦，水走肠间，沥沥有声，谓之痰饮'
  },
  {
    name: 'xuan_yin',
    title: '悬饮',
    kind: 'summary',
    comment: CH12 + '：饮后水流在胁下，咳唾引痛，谓之悬饮……脉沉而弦者，悬饮内痛……病悬饮者，十枣汤主之。',
    needs: [
      // 咳唾引痛是悬饮最特异的表现（水停在胁下，咳嗽牵引作痛）
      ['cough_pleuritic_pain.yes'],
      ['cough_pleuritic_pain.yes', 'hypochondriac_fullness.yes']
    ],
    contraindications: [
      '四饮之一。悬饮是水饮停在**胁下**，像悬挂在胸胁之间，所以叫「悬」',
      '典型表现：咳唾引痛——一咳嗽、一吐痰，胁下就牵扯着痛',
      '原文还有「脉沉而弦者，悬饮内痛」（脉象按口径不入条件）',
      '对应现代医学的胸腔积液一类情况',
      '主治方十枣汤是峻下逐水的猛方，必须严格掌握',
      '⚠ 悬饮伴气促、不能平卧、一侧胸廓饱满的，务必先做影像检查明确诊断'
    ],
    ref: CH12 + ' · 饮后水流在胁下，咳唾引痛，谓之悬饮'
  },
  {
    name: 'yi_yin',
    title: '溢饮',
    kind: 'summary',
    comment: CH12 + '：饮水流行，归于四肢，当汗出而不汗出，身体疼重，谓之溢饮……病溢饮者，当发其汗。',
    needs: [
      // 身体疼重 + 不出汗 —— 原文的溢饮定义
      ['body_pain.yes', 'body_heavy.yes', 'no_sweat.yes'],
      ['body_pain.yes', 'body_heavy.yes']
    ],
    contraindications: [
      '四饮之一。溢饮是水饮泛溢到**四肢肌表**，所以叫「溢」',
      '关键三句：水归四肢、当汗出而不汗出、身体疼重',
      '治法原文说得非常明确：「当发其汗」——水在表就要从表解，用发汗法',
      '大青龙汤（偏表实有热）、小青龙汤（偏寒饮）都能用',
      '和水肿的区别：溢饮以身体疼重为主，不一定是明显可凹性水肿'
    ],
    ref: CH12 + ' · 饮水流行，归于四肢，当汗出而不汗出，身体疼重，谓之溢饮'
  },
  {
    name: 'zhi_yin',
    title: '支饮',
    kind: 'summary',
    comment: CH12 + '：咳逆倚息，气短不得卧，其形如肿，谓之支饮……膈间支饮，其人喘满，心下痞坚，面色黧黑。',
    needs: [
      // 咳 + 不能平躺（得靠着呼吸）—— 支饮核心
      ['cough.yes', 'orthopnea.yes'],
      // 喘满 + 胸闷气塞
      ['orthopnea.yes', 'chest_qi_stuffiness.yes'],
      // 躺不平 + 面部发黑（久病支饮）
      ['orthopnea.yes', 'face_black.yes']
    ],
    contraindications: [
      '四饮之一。支饮是水饮支撑在**胸膈**，阻碍肺气升降，所以叫「支」',
      '典型表现：咳逆倚息不得卧——咳得厉害、只能靠着坐、躺不平，外形看着像肿了',
      '久病的支饮会出现「喘满、心下痞坚、面色黧黑」，说明水饮结得深、血行也不畅了',
      '对应现代医学的慢性心衰、肺心病、胸腔积液等可出现类似表现',
      '⚠ 躺不平、喘得厉害、面唇发绀，是心功能不全的常见信号，必须及时就医'
    ],
    ref: CH12 + ' · 咳逆倚息，气短不得卧，其形如肿，谓之支饮'
  }
]

// ---------- 方剂 8 个新建 ----------
const FORMULAS = [
  {
    name: 'gansui_banxia_tang',
    title: '甘遂半夏汤',
    kind: 'formula',
    comment: CH12 + '：病者脉伏，其人欲自利，利反快，虽利，心下续坚满，此为留饮欲去故也，甘遂半夏汤主之。',
    needs: [
      // 拉肚子后反而舒服，但心下仍然坚满 —— 留饮欲去的特异表现
      ['diarrhea.yes', 'epigastric_pressing_pain.yes'],
      ['diarrhea.yes', 'chest_qi_stuffiness.yes', 'tan_yin.yes']
    ],
    contraindications: [
      '治留饮欲去：本来拉肚子，拉完反而觉得舒服，但心口下面又继续硬满——说明水饮想走又走不干净',
      '甘遂峻下逐水，半夏化痰散结，芍药、甘草、白蜜缓急护正',
      '**甘遂有毒**，且原文特意注明「以蜜半升和药汁」——用蜜制缓其峻烈',
      '「利反快」是辨证关键：一般的腹泻拉完是虚，这种拉完却轻松，说明是在排邪',
      '孕妇、体虚、无实邪者忌用'
    ],
    ref: CH12 + ' · 病者脉伏，其人欲自利，利反快，虽利，心下续坚满，此为留饮欲去故也，甘遂半夏汤主之'
  },
  {
    name: 'mufangji_tang',
    title: '木防己汤',
    kind: 'formula',
    comment: CH12 + '：膈间支饮，其人喘满，心下痞坚，面色黧黑，其脉沉紧，得之数十日，医吐下之不愈，木防己汤主之。',
    needs: [
      // 喘满 + 心下痞坚 + 面色黧黑 —— 原文三联征
      ['orthopnea.yes', 'epigastric_pressing_pain.yes', 'face_black.yes'],
      ['chest_qi_stuffiness.yes', 'epigastric_pressing_pain.yes', 'face_black.yes']
    ],
    contraindications: [
      '治膈间支饮的重证：喘满、心口下面痞硬坚满、面色黧黑发暗',
      '「得之数十日，医吐下之不愈」——病程长，用吐法和下法都没效，说明是虚实夹杂',
      '木防己、桂枝通阳利水，石膏清郁热，人参补正气——攻补兼施',
      '原文给了预后判断：**虚者即愈，实者三日复发**——如果补正后好转，说明虚为主；如果三天又复发，说明实结未去',
      '复发后用木防己汤去石膏加茯苓芒硝汤'
    ],
    ref: CH12 + ' · 膈间支饮，其人喘满，心下痞坚，面色黧黑……木防己汤主之'
  },
  {
    name: 'mufangji_qu_shigao_jia_fuling_mangxiao_tang',
    title: '木防己汤去石膏加茯苓芒硝汤',
    kind: 'formula',
    comment: CH12 + '：虚者即愈，实者三日复发，后与不愈者，宜木防己汤去石膏加茯苓芒硝汤主之。',
    needs: [
      ['mufangji_tang.yes', 'constipation.yes'],
      ['epigastric_pressing_pain.yes', 'face_black.yes', 'constipation.yes']
    ],
    contraindications: [
      '治木防己汤证「实者三日复发」的情况——补正后短期好转又复发，说明实结顽固',
      '去掉石膏（无热象了），加茯苓、芒硝：茯苓利水，芒硝软坚散结、通下',
      '从「清热」转向「软坚逐水」，针对心下痞坚这个硬结',
      '芒硝须冲服（烊化），不宜久煎'
    ],
    ref: CH12 + ' · 实者三日复发，后与不愈者，宜木防己汤去石膏加茯苓芒硝汤主之'
  },
  {
    name: 'zexie_tang',
    title: '泽泻汤',
    kind: 'formula',
    comment: CH12 + '：心下有支饮，其人苦冒眩，泽泻汤主之。',
    needs: [
      // 「苦冒眩」= 头目昏冒、天旋地转，是本方唯一且最特异的靶点
      ['dizziness.yes', 'tan_yin.yes'],
      ['dizziness.yes', 'throat_rales.yes'],
      ['dizziness.yes', 'saliva_spit.yes']
    ],
    contraindications: [
      '治「苦冒眩」——水饮停在心下，清阳不升，头目像被蒙住、天旋地转',
      '只有两味：泽泻（五两，重用利水）、白术（二两，健脾燥湿）',
      '「苦」字说明晕得很难受，是主要痛苦',
      '这是治水饮眩晕的极简方，现代常用于梅尼埃病、耳源性眩晕属水饮上泛者',
      '和苓桂术甘汤的区别：苓桂术甘汤有胸胁支满、心悸；泽泻汤专以冒眩为主'
    ],
    ref: CH12 + ' · 心下有支饮，其人苦冒眩，泽泻汤主之'
  },
  {
    name: 'houpo_dahuang_tang',
    title: '厚朴大黄汤',
    kind: 'formula',
    comment: CH12 + '：支饮胸满者，厚朴大黄汤主之。',
    needs: [
      // 支饮 + 胸满（实满）
      ['zhi_yin.yes', 'chest_qi_stuffiness.yes'],
      ['chest_qi_stuffiness.yes', 'constipation.yes', 'tan_yin.yes']
    ],
    contraindications: [
      '治支饮而胸腹胀满属实证者',
      '厚朴、大黄、枳实三味——就是小承气汤的变方，但**厚朴用量特别大**（一尺），重在行气除满',
      '和厚朴三物汤、小承气汤同为「朴枳黄」组合，区别在剂量侧重：本方重在开胸除满',
      '体虚、无实满者不宜'
    ],
    ref: CH12 + ' · 支饮胸满者，厚朴大黄汤主之'
  },
  {
    name: 'xiaobanxia_tang',
    title: '小半夏汤',
    kind: 'formula',
    comment: CH12 + '：呕家本渴，渴者为欲解，今反不渴，心下有支饮故也，小半夏汤主之。',
    needs: [
      // 呕吐 + 口不渴（支饮停心下，水饮上逆而呕）
      ['vomiting.yes', 'thirsty.no'],
      ['vomiting.yes', 'saliva_spit.yes']
    ],
    contraindications: [
      '治支饮呕吐。原文的推理很妙：**呕吐的人本来应该口渴**（吐伤了津液），如果口渴说明饮邪要解；' +
      '现在反而不渴，说明心下停着支饮，水饮上逆才吐，所以用小半夏汤',
      '只有两味：半夏（一升，重用）降逆止呕，生姜（半斤）散饮止呕',
      '是「治呕」的祖方，后世无数止呕方都由它化出',
      '「不渴」是本方的核心指征——口渴的呕吐不适用'
    ],
    ref: CH12 + ' · 呕家本渴，渴者为欲解，今反不渴，心下有支饮故也，小半夏汤主之'
  },
  {
    name: 'xiaobanxia_jia_fuling_tang',
    title: '小半夏加茯苓汤',
    kind: 'formula',
    comment: CH12 + '：卒呕吐，心下痞，膈间有水，眩悸者，小半夏加茯苓汤主之。',
    needs: [
      // 呕吐 + 头眩 + 心悸（水饮上凌）
      ['vomiting.yes', 'dizziness.yes', 'heart_palp.yes'],
      ['vomiting.yes', 'epigastric_lump_soft.yes', 'dizziness.yes']
    ],
    contraindications: [
      '治膈间有水：突然呕吐、心口发痞堵、头晕、心慌',
      '就是小半夏汤加茯苓——加茯苓是关键，因为要**利水**，不只是止呕',
      '和小半夏汤的区别：小半夏汤只管呕吐（水饮在上），本方多了眩、悸，说明水饮已经影响到心',
      '方后注说「小便利则愈」——小便一通，水有出路，病就好了'
    ],
    ref: CH12 + ' · 卒呕吐，心下痞，膈间有水，眩悸者，小半夏加茯苓汤主之'
  },
  {
    name: 'jijiao_lili_huang_wan',
    title: '己椒苈黄丸',
    kind: 'formula',
    comment: CH12 + '：腹满，口舌干燥，此肠间有水气，己椒苈黄丸主之。',
    needs: [
      // 腹满 + 口舌干燥（水停肠间、津不上承）
      ['abdominal_fullness.yes', 'throat_dry.yes'],
      ['abdominal_fullness.yes', 'borborygmus.yes', 'throat_dry.yes']
    ],
    contraindications: [
      '治肠间有水气：肚子胀满，同时口舌干燥——这个组合很有意思，水明明很多却口渴，因为水停肠间、津液上不来',
      '四味：防己、椒目（利水）、葶苈子（泻肺行水）、大黄（通下）——前后分消，让水从大小便排出',
      '做成蜜丸（如梧子大，先食饮服一丸，日三服），「日三服，稍增，口中有津液渴者，加芒硝半两」',
      '原文的观察点：「先食饮服」——饭前服，且逐渐加量；口中出现津液、口渴缓解说明有效',
      '体虚、孕妇慎用'
    ],
    ref: CH12 + ' · 腹满，口舌干燥，此肠间有水气，己椒苈黄丸主之'
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
// 注意：木防己汤去石膏加茯苓芒硝汤 要引用同批新建的 mufangji_tang，
// 所以「将存在」集合必须同时包含症状、证候和本批方剂。
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

// 给既有方剂追加路径
function appendPath(id, newPaths, note, extraContra) {
  const dirs = ['formulas', 'syndromes']
  let f = null
  for (const d of dirs) {
    const p = path.join(PLUGINS, d, id + '.js')
    if (fs.existsSync(p)) { f = p; break }
  }
  if (!f) return '   ⚠ 找不到 ' + id
  let src = fs.readFileSync(f, 'utf8')
  if (newPaths.some(p => src.includes(p[0].split('.')[0] + '.yes'))) return '   = ' + id + ' 已有相关路径'
  const lines = newPaths.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
  let out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) {
    out = src.replace(/(\n\s*\]\n\s*\})/, ',\n' + note + '\n' + lines + '$1')
  }
  if (out === src) return '   ⚠ ' + id + ' 没找到插入点'
  fs.writeFileSync(f, out, 'utf8')
  return '   ＋ ' + id + ' 追加 ' + newPaths.length + ' 条路径'
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

  console.log('\n=== 既有方剂追加痰饮路径 ===')
  console.log(appendPath('linggui_shugan_tang',
    [['hypochondriac_fullness.yes', 'dizziness.yes'], ['dizziness.yes', 'tan_yin.yes']],
    '    // 金匮 12.17：心下有痰饮，胸胁支满，目眩，苓桂术甘汤主之'))
  console.log(appendPath('shizao_tang',
    [['xuan_yin.yes']],
    '    // 金匮 12.23：病悬饮者，十枣汤主之'))
  console.log(appendPath('daqinglong_tang',
    [['yi_yin.yes']],
    '    // 金匮 12.24：病溢饮者，当发其汗，大青龙汤主之'))
  console.log(appendPath('xiaoqinglong_tang',
    [['yi_yin.yes']],
    '    // 金匮 12.24：病溢饮者……小青龙汤亦主之'))
  console.log(appendPath('tingli_dazao_xiefei_tang',
    [['zhi_yin.yes', 'orthopnea.yes']],
    '    // 金匮 12.28：支饮不得息，葶苈大枣泻肺汤主之'))
  console.log(appendPath('wuling_san',
    [['below_palp.yes', 'saliva_spit.yes']],
    '    // 金匮 12.32：假令瘦人脐下有悸，吐涎沫而癫眩，此水也，五苓散主之'))
  console.log(appendPath('bawei_shenqi_wan',
    [['short_breath.yes', 'yaosuan.yes']],
    '    // 金匮 12.18：夫短气有微饮，当从小便去之……肾气丸亦主之'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(24) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
