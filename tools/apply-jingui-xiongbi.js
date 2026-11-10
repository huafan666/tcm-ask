'use strict'
// tools/apply-jingui-xiongbi.js
// 金匮批 11：第九篇 胸痹心痛短气病脉证并治（9.1 ~ 9.13）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 9.1「阳微阴弦」是脉象病机总纲、9.2「短气不足以息者实也」是辨证断语 → 均不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH9 = '金匮要略·胸痹心痛短气病脉证并治第九'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'chest_back_pain',
    title: '胸痛连着后背疼',
    kind: 'symptom',
    comment: CH9 + '：胸痹之病，喘息咳唾，胸背痛，短气。',
    trigger: ['胸痛连着后背', '胸背痛', '胸口痛扯到后背', '胸前痛后背也痛', '胸痛连背',
      '胸口连着背部痛', '前胸后背都痛'],
    negate: ['胸背不痛'],
    ask: '是不是胸口痛，同时后背也跟着痛、像一条线连着？'
  },
  {
    name: 'heart_pain_radiate',
    title: '心痛透到后背、背痛透到心',
    kind: 'symptom',
    comment: CH9 + '：心痛彻背，背痛彻心（疼痛前后穿透，程度剧烈）。',
    trigger: ['心痛透到后背', '心痛彻背', '背痛彻心', '心痛得前后穿透', '胸口痛透到背后',
      '心口痛穿到后背', '前后一起钻着痛'],
    negate: ['心痛不放射'],
    ask: '是不是心口疼起来一直穿透到后背，后背疼也反过来透到心口？'
  },
  {
    name: 'heart_hanging_pain',
    title: '心口像悬空一样地疼',
    kind: 'symptom',
    comment: CH9 + '：心中痞，诸逆，心悬痛。',
    trigger: ['心口像悬空一样疼', '心悬痛', '心口空落落地疼', '心口悬着疼',
      '心口发空又疼', '心口揪着一阵阵疼'],
    negate: ['心口不疼'],
    ask: '是不是心口那里像悬空、往下坠着疼，一阵一阵揪着？'
  },
  {
    name: 'hypochondriac_rush',
    title: '胁下有气往上冲心',
    kind: 'symptom',
    comment: CH9 + '：胸满，胁下逆抢心（气从胁下向上冲逆，撞到心口）。',
    trigger: ['胁下有气往上冲心', '胁下逆抢心', '气从肋骨下往上撞心', '两肋下有气往上顶',
      '胁下气往上冲', '肋骨下的气往上抢'],
    negate: ['胁下没有气上冲'],
    ask: '是不是感觉有气从两侧肋骨下面往上冲、一直撞到心口？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'xiong_bi',
    title: '胸痹',
    kind: 'summary',
    comment: CH9 + '：胸痹之病，喘息咳唾，胸背痛，短气……胸痹不得卧，心痛彻背……胸痹，胸中气塞，短气。',
    needs: [
      // 胸背痛是胸痹最核心的表现
      ['chest_back_pain.yes'],
      // 胸背痛 + 短气
      ['chest_back_pain.yes', 'short_breath.yes'],
      // 胸背痛 + 喘息咳唾
      ['chest_back_pain.yes', 'cough.yes'],
      // 胸闷气塞 + 短气（9.6 的轻证）
      ['chest_stuffy.yes', 'short_breath.yes'],
      // 躺不平 + 心痛透背（9.4 的重证）
      ['heart_pain_radiate.yes']
    ],
    contraindications: [
      '胸痹是胸中阳气不通、痰浊瘀血痹阻，表现为胸背痛、胸闷、气短、喘咳',
      '病机原文叫「阳微阴弦」——上焦阳气太虚（阳微），下焦阴寒之邪反而上乘（阴弦）',
      '轻重分层：轻的只是胸中气塞短气（茯苓杏仁甘草汤/橘枳姜汤）；重的躺不平、心痛透到后背（栝蒌薤白半夏汤）',
      '《金匮》的胸痹包含现代的冠心病心绞痛、部分食管与胸壁疾患',
      '胸闷痛持续不缓解、伴大汗出、面唇发紫的，要立刻急诊，别在家里辨证'
    ],
    ref: CH9 + ' · 胸痹之病，喘息咳唾，胸背痛，短气'
  },
  {
    name: 'xin_tong',
    title: '心痛',
    kind: 'summary',
    comment: CH9 + '：心中痞，诸逆，心悬痛……心痛彻背，背痛彻心，乌头赤石脂丸主之。',
    needs: [
      // 心痛透背 —— 最典型的阴寒极盛心痛
      ['heart_pain_radiate.yes'],
      // 心口悬空样痛 + 气逆上冲
      ['heart_hanging_pain.yes', 'qi_surge.yes'],
      ['heart_hanging_pain.yes', 'hypochondriac_rush.yes']
    ],
    contraindications: [
      '心痛比胸痹更重、更偏「阴寒极盛」：疼起来前后穿透，心痛彻背、背痛彻心',
      '属阴寒痼结、阳气不通，用乌头赤石脂丸这类大辛大热药急温',
      '轻一些的心口悬空样痛、气往上冲，是桂枝生姜枳实汤的方向',
      '同样要警惕：持续胸痛不缓解、冷汗、发绀是高危信号，须立即就医'
    ],
    ref: CH9 + ' · 心痛彻背，背痛彻心，乌头赤石脂丸主之'
  }
]

// ---------- 方剂 10 个 ----------
const FORMULAS = [
  {
    name: 'gualou_xiebai_baijiu_tang',
    title: '栝蒌薤白白酒汤',
    kind: 'formula',
    comment: CH9 + '：胸痹之病，喘息咳唾，胸背痛，短气，寸口脉沉而迟，关上小紧数，栝蒌薤白白酒汤主之。',
    needs: [
      ['chest_back_pain.yes', 'short_breath.yes'],
      ['chest_back_pain.yes', 'cough.yes']
    ],
    contraindications: [
      '胸痹的基础方：胸背痛 + 气短 + 喘息咳唾',
      '只有三味：栝蒌实（宽胸化痰）、薤白（通阳散结）、白酒（行药势、通阳）',
      '核心是「通阳散结、豁痰下气」——胸阳不通才痛，把阳气通开',
      '脉象原文用「寸口沉迟、关上小紧」定位（按口径不入条件）'
    ],
    ref: CH9 + ' · 栝蒌薤白白酒汤方（栝蒌实一枚捣、薤白半斤、白酒七升）'
  },
  {
    name: 'gualou_xiebai_banxia_tang',
    title: '栝蒌薤白半夏汤',
    kind: 'formula',
    comment: CH9 + '：胸痹不得卧，心痛彻背者，栝蒌薤白半夏汤主之。',
    needs: [
      ['orthopnea.yes', 'heart_pain_radiate.yes'],
      ['chest_back_pain.yes', 'orthopnea.yes']
    ],
    contraindications: [
      '比栝蒌薤白白酒汤更重：不但胸背痛，还「不得卧」（躺不平）、心痛透到后背',
      '即白酒汤加半夏——痰浊更重，加半夏化痰降逆',
      '白酒用量也加大（一斗），取通行阳气之力更强',
      '出现不得卧说明痰浊壅盛已影响呼吸'
    ],
    ref: CH9 + ' · 胸痹不得卧，心痛彻背者，栝蒌薤白半夏汤主之'
  },
  {
    name: 'zhishi_xiebai_guizhi_tang',
    title: '枳实薤白桂枝汤',
    kind: 'formula',
    comment: CH9 + '：胸痹心中痞气，气结在胸，胸满，胁下逆抢心，枳实薤白桂枝汤主之。',
    needs: [
      // 胁下有气往上冲心 + 胸闷
      ['hypochondriac_rush.yes', 'chest_stuffy.yes'],
      ['hypochondriac_rush.yes', 'hypochondriac_fullness.yes']
    ],
    contraindications: [
      '治胸痹实证：胸中气结成痞、胸闷，还有气从胁下往上冲心',
      '枳实、厚朴破气散结，薤白、桂枝通阳，栝蒌宽胸——偏「实证、气结明显」',
      '和人参汤的区别：本条是实证（气结、胁下逆抢心），人参汤是虚证（阳气虚、无力推动）',
      '原文同一条给了两个方，正是「一实一虚」的对照'
    ],
    ref: CH9 + ' · 胸痹心中痞气，气结在胸，胸满，胁下逆抢心，枳实薤白桂枝汤主之'
  },
  {
    name: 'renshen_tang',
    title: '人参汤',
    kind: 'formula',
    comment: CH9 + '：胸痹心中痞气，气结在胸，胸满，胁下逆抢心……人参汤亦主之。',
    needs: [
      // 虚证：胸闷痞 + 明显虚象（没劲/怕冷）
      ['chest_stuffy.yes', 'low_energy.yes'],
      ['chest_stuffy.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '同一条文里和枳实薤白桂枝汤并列，走的是「虚证」路线：胸阳不振、中焦虚寒',
      '组成就是理中丸（人参、干姜、白术、甘草）——温补中阳，阳气足了胸阳才能振',
      '和枳实薤白桂枝汤的鉴别：实证见气结胀满、脉沉紧有力；虚证见倦怠乏力、四肢凉、脉弱',
      '胸痹久病多虚，不能一味破气通阳'
    ],
    ref: CH9 + ' · 胸痹心中痞气……人参汤亦主之'
  },
  {
    name: 'fuling_xingren_gancao_tang',
    title: '茯苓杏仁甘草汤',
    kind: 'formula',
    comment: CH9 + '：胸痹，胸中气塞，短气，茯苓杏仁甘草汤主之。',
    needs: [
      // 胸闷气塞 + 短气，偏「水饮」为主
      ['chest_stuffy.yes', 'short_breath.yes', 'cough.yes'],
      ['chest_stuffy.yes', 'short_breath.yes']
    ],
    contraindications: [
      '治胸痹轻证：胸中气塞、短气，偏水饮停聚',
      '三味：茯苓利水、杏仁宣肺降气、甘草和中——宣肺利水',
      '原文和橘枳姜汤并列，两者一偏饮、一偏气：本方偏「饮」，橘枳姜偏「气」',
      '胸痹轻证可用，重证需配合其他方'
    ],
    ref: CH9 + ' · 胸痹，胸中气塞，短气，茯苓杏仁甘草汤主之'
  },
  {
    name: 'juzhi_jiang_tang',
    title: '橘枳姜汤',
    kind: 'formula',
    comment: CH9 + '：胸痹，胸中气塞，短气……橘枳姜汤亦主之。',
    needs: [
      // 胸闷气塞，偏气滞（无明显短气也可）
      ['chest_stuffy.yes', 'restless.yes'],
      ['chest_stuffy.yes', 'belching.yes']
    ],
    contraindications: [
      '和茯苓杏仁甘草汤同条并列，本方偏气滞：橘皮、枳实、生姜行气降逆',
      '适合胸闷气塞、常叹气或嗳气、心情不舒的人',
      '一偏饮（茯苓杏仁甘草汤）、一偏气（橘枳姜汤），随证选用',
      '偏气滞者可两方合用'
    ],
    ref: CH9 + ' · 胸痹，胸中气塞，短气……橘枳姜汤亦主之'
  },
  {
    name: 'yiyi_fuzi_san',
    title: '薏苡附子散',
    kind: 'formula',
    comment: CH9 + '：胸痹缓急者，薏苡附子散主之。',
    needs: [
      // 胸痹时轻时重（「缓急」= 时缓时急）+ 寒象
      ['chest_back_pain.yes', 'cold_aversion.yes'],
      ['chest_back_pain.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治「胸痹缓急」——疼痛时轻时重、时缓时急，发作有间歇',
      '只有薏苡仁 + 附子两味，附子温阳散寒、薏苡仁除湿宣痹',
      '偏寒湿痹阻的胸痹，适合阴雨天加重、遇冷发作的类型',
      '附子有毒须炮制久煎'
    ],
    ref: CH9 + ' · 胸痹缓急者，薏苡附子散主之'
  },
  {
    name: 'guizhi_shengjiang_zhishi_tang',
    title: '桂枝生姜枳实汤',
    kind: 'formula',
    comment: CH9 + '：心中痞，诸逆，心悬痛，桂枝生姜枳实汤主之。',
    needs: [
      // 心口悬空样痛 + 气逆上冲/胁下逆抢心
      ['heart_hanging_pain.yes', 'qi_surge.yes'],
      ['heart_hanging_pain.yes', 'hypochondriac_rush.yes'],
      ['heart_hanging_pain.yes']
    ],
    contraindications: [
      '治「心中痞、诸逆、心悬痛」——心口发堵、各种气逆上冲、心口像悬着疼',
      '三味：桂枝通阳、生姜散寒降逆、枳实破气消痞',
      '偏寒饮气逆的心痛，程度较乌头赤石脂丸轻',
      '和桂枝加桂汤区别：那条是奔豚气从少腹上冲、有灸疮诱因'
    ],
    ref: CH9 + ' · 心中痞，诸逆，心悬痛，桂枝生姜枳实汤主之'
  },
  {
    name: 'wutou_chishizhi_wan',
    title: '乌头赤石脂丸',
    kind: 'formula',
    comment: CH9 + '：心痛彻背，背痛彻心，乌头赤石脂丸主之。',
    needs: [
      // 心痛前后穿透 —— 本方唯一且最特异的目标
      ['heart_pain_radiate.yes'],
      ['heart_pain_radiate.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治阴寒极盛的心痛重证：心痛彻背、背痛彻心，前后穿透，疼得剧烈',
      '五味：乌头、附子、蜀椒、干姜、赤石脂——四味大辛大热温散阴寒，赤石脂收敛固涩、防辛散太过',
      '**乌头、附子同用且都有毒**，必须严格按原方炮制（炮）、做成蜜丸小量服（先食服一丸、日三服），绝不能自行加量',
      '孕妇绝对忌用；服后唇舌发麻立即停药就医',
      '⚠ 心痛彻背在现代首先要排除急性心梗，务必同时急诊检查，不可只靠中药'
    ],
    ref: CH9 + ' · 心痛彻背，背痛彻心，乌头赤石脂丸主之 · 乌头一分炮、附子半两炮、蜀椒一两、干姜一两、赤石脂一两，蜜丸如梧子大'
  },
  {
    name: 'jiutong_wan',
    title: '九痛丸',
    kind: 'formula',
    comment: CH9 + '：九痛丸：治九种心痛。',
    needs: [
      // 心痛 + 腹部胀痛（原文兼治卒中恶、腹胀痛）
      ['heart_hanging_pain.yes', 'abdominal_pain.yes'],
      ['heart_pain_radiate.yes', 'abdominal_pain.yes'],
      ['abdominal_pain.yes', 'cold_extremities.yes', 'heart_hanging_pain.yes']
    ],
    contraindications: [
      '治「九种心痛」——泛指多种心腹疼痛，包括兼治卒中恶、腹胀痛、口不能言，以及连年积冷、流注心胸痛',
      '五味：附子、生狼牙、巴豆、人参、干姜、吴茱萸——大辛大热、峻猛攻逐，配人参护正',
      '**巴豆是大毒峻下药**，狼牙亦有毒，做成蜜丸小量（强人三丸、弱者二丸），中病即止',
      '孕妇绝对忌用；体虚、腹泻者忌用',
      '原文还提到可治跌打坠落（落马坠车）引起的血瘀疼痛'
    ],
    ref: CH9 + ' · 九痛丸：治九种心痛（附子三两、生狼牙一两、巴豆一两、人参、干姜、吴茱萸各一两，蜜丸）'
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
