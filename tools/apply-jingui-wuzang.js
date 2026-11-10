'use strict'
// tools/apply-jingui-wuzang.js
// 金匮批 13：第十一篇 五脏风寒积聚病脉证并治（11.1 ~ 11.20）
//
// 本篇大部分是五脏「中风中寒」的病机描述和「死脏」脉象，按既定口径不落节点：
//   11.3 / 11.6 / 11.11 / 11.14 / 11.17 是五条死脏脉（纯脉象）
//   11.1 / 11.2 / 11.4 / 11.5 / 11.8 / 11.9 / 11.10 / 11.13 是五脏中风中寒描述（无方）
//   11.18 / 11.19 是三焦寒热病机（无方）
// 只落有方证的：11.7 肝著、11.15 脾约、11.16 肾著；另落 11.12 癫狂、11.20 积聚。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH11 = '金匮要略·五脏风寒积聚病脉证并治第十一'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'desire_to_press_chest',
    title: '总想捶打胸口',
    kind: 'symptom',
    comment: CH11 + '：肝著，其人常欲蹈其胸上（蹈＝捶打踩踏，胸中气机不畅，捶打才舒服）。',
    trigger: ['总想捶打胸口', '想捶胸口', '常欲蹈其胸上', '胸口发闷想捶一捶', '喜欢捶打胸口',
      '捶打胸口才舒服', '胸口闷得想敲'],
    negate: ['不想捶胸口'],
    ask: '是不是胸口发闷，总想用手捶一捶、压一压才舒服？'
  },
  {
    name: 'lower_back_cold',
    title: '腰部发冷',
    kind: 'symptom',
    comment: CH11 + '：肾著之病……腰中冷，如坐水中……腰以下冷痛。',
    trigger: ['腰部发冷', '腰中冷', '腰冰凉', '腰以下冷', '腰冷得像泡在水里',
      '腰又冷又痛', '腰上像放了冰'],
    negate: ['腰不冷'],
    ask: '是不是腰部发凉发冷，像泡在冷水里一样？'
  },
  {
    name: 'fixed_mass',
    title: '固定不移的包块',
    kind: 'symptom',
    comment: CH11 + '：积者，脏病也，终不移（积＝固定在一处不动）。',
    trigger: ['固定不移的包块', '包块不动', '一直在一个地方不动', '硬块固定在一处',
      '积块固定', '摸到的块一直在原处'],
    negate: ['包块会移动'],
    ask: '是不是能摸到一个包块，位置固定、一直在原处不动？'
  },
  {
    name: 'migratory_pain',
    title: '疼痛游走不定',
    kind: 'symptom',
    comment: CH11 + '：聚者，腑病也，发作有时，展转痛移（聚＝时发时止、痛点会转移）。',
    trigger: ['疼痛游走不定', '痛处会跑', '疼痛转移', '一阵这儿痛一阵那儿痛',
      '展转痛移', '疼的地方会变', '游走性疼痛'],
    negate: ['痛处固定'],
    ask: '是不是疼的地方会转移、一会儿这里一会儿那里，时发时止？'
  }
]

// ---------- 证候 4 个 ----------
const SUMMARIES = [
  {
    name: 'gan_zhu',
    title: '肝著',
    kind: 'summary',
    comment: CH11 + '：肝著，其人常欲蹈其胸上，先未苦时，但欲饮热，旋覆花汤主之。',
    needs: [
      // 特异性表现：总想捶打胸口
      ['desire_to_press_chest.yes'],
      ['desire_to_press_chest.yes', 'chest_qi_stuffiness.yes'],
      ['desire_to_press_chest.yes', 'hypochondriac_fullness.yes']
    ],
    contraindications: [
      '肝著是肝经气血郁滞、着而不行，最形象的表现就是「常欲蹈其胸上」——总想捶一捶胸口',
      '原文还说「先未苦时，但欲饮热」——还没严重时只想喝热的，说明是寒凝气滞',
      '病位在肝（两胁、胸中），病性是气滞血瘀',
      '和胸痹的区别：胸痹是胸阳不通、胸背痛为主；肝著是气机郁着、以「想捶胸口」为特点'
    ],
    ref: CH11 + ' · 肝著，其人常欲蹈其胸上，先未苦时，但欲饮热，旋覆花汤主之'
  },
  {
    name: 'shen_zhu',
    title: '肾著',
    kind: 'summary',
    comment: CH11 + '：肾著之病，其人身体重，腰中冷，如坐水中，形如水状，反不渴，小便自利，饮食如故……腰以下冷痛，腹重如带五千钱。',
    needs: [
      // 腰冷 + 身体沉重（原文两个核心）
      ['lower_back_cold.yes', 'body_heavy.yes'],
      // 腰冷 + 腰以下痛
      ['lower_back_cold.yes', 'body_pain.yes'],
      // 腰冷 + 腹重如带五千钱
      ['lower_back_cold.yes', 'weight_loss.no', 'body_heavy.yes']
    ],
    contraindications: [
      '肾著不是肾虚，是**寒湿之邪痹着在腰部**（原文说「病属下焦」，起因是身劳汗出、衣服湿冷、久久得之）',
      '典型三句话：身体重、腰中冷「如坐水中」、腰以下冷痛「腹重如带五千钱」（腰腹沉重得像缠了五千枚铜钱）',
      '关键鉴别：**反不渴、小便自利、饮食如故**——说明不是肾脏本身虚了，津液和食欲都正常，只是外湿痹着',
      '所以治法不是补肾，而是温中散寒除湿（甘姜苓术汤，又叫肾著汤）',
      '与肾阳虚腰痛区别：肾阳虚多伴小便清长频数、夜尿多、下肢浮肿'
    ],
    ref: CH11 + ' · 肾著之病，其人身体重，腰中冷，如坐水中……腹重如带五千钱'
  },
  {
    name: 'dian_kuang',
    title: '癫狂',
    kind: 'summary',
    comment: CH11 + '：邪哭使魂魄不安者，血气少也……心气虚者，其人则畏，合目欲眠，梦远行而精神离散，魂魄妄行。阴气衰者为癫，阳气衰者为狂。',
    needs: [
      // 心气虚则畏 + 合目欲眠 + 梦远行（癫的方向）
      ['low_energy.yes', 'sleepy.yes', 'delirium.yes'],
      // 癫：抑郁、恐惧、嗜睡
      ['low_energy.yes', 'sleepy.yes'],
      // 狂：发狂 + 到处乱走
      ['manic.yes', 'aimless_walking.yes'],
      ['manic.yes', 'self_talk_ceaseless.yes']
    ],
    contraindications: [
      '癫和狂是两种相反的表现，原文用一句话点明：「阴气衰者为癫，阳气衰者为狂」',
      '癫偏阴：情绪低落、无故恐惧（心气虚则畏）、闭眼想睡、做梦远行、精神涣散',
      '狂偏阳：躁动发狂、到处乱走、自言自语',
      '共同根源是「血气少」——气血不足、心神失养，魂魄不安',
      '和阳明实热发狂（大承气汤证）区别：那种有腹满硬痛、大便不通、潮热谵语，属实'
    ],
    ref: CH11 + ' · 阴气衰者为癫，阳气衰者为狂'
  },
  {
    name: 'ji_ju',
    title: '积聚',
    kind: 'summary',
    comment: CH11 + '：积者，脏病也，终不移；聚者，腑病也，发作有时，展转痛移，为可治。',
    needs: [
      // 积：固定不移的包块
      ['fixed_mass.yes'],
      ['fixed_mass.yes', 'abdominal_pain.yes'],
      // 聚：疼痛游走、时发时止
      ['migratory_pain.yes', 'abdominal_pain.yes'],
      ['migratory_pain.yes']
    ],
    contraindications: [
      '积和聚的根本区别就八个字：**积者终不移，聚者展转痛移**',
      '「积」属脏病，包块固定在一处不动，病程长、较难治，多属瘀血痰浊凝结',
      '「聚」属腑病，时发时止、痛点会游走，原文说「为可治」，多属气机聚散',
      '原文另提「谷气」：胁下痛、按之则愈、但会复发，是饮食积滞所致',
      '⚠ 固定包块要警惕肿瘤等器质性疾病，务必做影像检查，不能只靠中药'
    ],
    ref: CH11 + ' · 积者，脏病也，终不移；聚者，腑病也，发作有时，展转痛移'
  }
]

// ---------- 方剂 2 个新建 ----------
const FORMULAS = [
  {
    name: 'xuanfuhua_tang',
    title: '旋覆花汤',
    kind: 'formula',
    comment: CH11 + '：肝著，其人常欲蹈其胸上，先未苦时，但欲饮热，旋覆花汤主之。',
    needs: [['gan_zhu.yes']],
    contraindications: [
      '治肝著：总想捶打胸口、胸中气机郁着不通',
      '三味：旋覆花（下气散结）、葱（通阳）、新绛（即茜草，活血通络）——下气通阳、行血通络',
      '原文要求「顿服」——一次服完，取速效',
      '这个方后来被叶天士发展为「辛润通络」法的祖方，用于胸胁久痛入络'
    ],
    ref: CH11 + ' · 旋覆花汤方（旋覆花三两、葱十四茎、新绛少许）'
  },
  {
    name: 'ganjiang_lingzhu_tang',
    title: '甘姜苓术汤（肾著汤）',
    kind: 'formula',
    comment: CH11 + '：肾著之病……腰以下冷痛，腹重如带五千钱，甘姜苓术汤主之。',
    needs: [['shen_zhu.yes']],
    contraindications: [
      '治肾著：腰中冷如坐水中、身体沉重、腰以下冷痛',
      '四味：甘草、干姜、茯苓、白术——即理中汤去人参，**温中散寒、健脾除湿**',
      '关键理解：本方**不补肾**。因为「反不渴、小便自利、饮食如故」，病不在肾之本，而在寒湿痹着，' +
      '所以要温中焦、运化水湿，湿去则腰冷自除',
      '又名「肾著汤」。原文服法是「温服八合，日三服」，服后「腰中即温」',
      '与济生肾气丸、真武汤等补肾温阳方完全不同，别混用'
    ],
    ref: CH11 + ' · 甘姜苓术汤方（甘草、白术各二两，干姜、茯苓各四两）'
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

  // 麻子仁丸：伤寒 247 条已经建过，needs 是 ['constipation.yes','frequent_urination.yes']，
  // 金匮 11.15「趺阳脉浮而涩……大便则坚，其脾为约」讲的是同一个脾约，
  // 所以**不需要改 needs**，只补一条出处说明。
  console.log('  = 方剂 maziren_wan 已覆盖脾约（伤寒 247 条 = 金匮 11.15 同一证），仅补出处')

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  prov.nodes['maziren_wan'] = {
    source: 'shanghanlun', label: '伤寒论第247条 + 金匮要略第十一篇',
    refs: [
      '伤寒论·第247条：趺阳脉浮而涩，浮则胃气强，涩则小便数，浮涩相搏，大便则硬，其脾为约，麻子仁丸主之',
      '金匮要略·五脏风寒积聚病脉证并治第十一：趺阳脉浮而涩……大便则坚，其脾为约，麻子仁丸主之'
    ], by: 'system:jinkui'
  }
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
