'use strict'
// tools/apply-jingui-outu.js
// 金匮批 18：第十七篇 呕吐哕下利病脉证并治（17.1 ~ 17.54）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 17.4/17.5/17.6/17.7/17.27~17.37 大量脉象与预后断语、17.1/17.8/17.26 禁忌与病机条 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH17 = '金匮要略·呕吐哕下利病脉证并治第十七'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'food_vomit_delayed',
    title: '早上吃的晚上吐、晚上吃的早上吐',
    kind: 'symptom',
    comment: CH17 + '：脾伤则不磨，朝食暮吐，暮食朝吐，宿谷不化，名曰胃反。',
    trigger: ['早上吃的晚上吐', '朝食暮吐', '暮食朝吐', '晚上吃的早上吐出来',
      '吃下去隔很久才吐', '吐出来的还是没消化的饭', '隔一顿才吐'],
    negate: ['吃完不吐'],
    ask: '是不是早上吃的东西要到晚上才吐出来（或者晚上吃的第二天早上吐），吐出来的还是没消化的？'
  },
  {
    name: 'vomit_right_after_eating',
    title: '一吃完就吐',
    kind: 'symptom',
    comment: CH17 + '：食已即吐者，大黄甘草汤主之。',
    trigger: ['一吃完就吐', '食已即吐', '刚吃完马上吐', '吃下去立刻就吐出来',
      '吃完饭立刻吐', '入口即吐'],
    negate: ['吃完不马上吐'],
    ask: '是不是刚吃完东西马上就吐出来？'
  },
  {
    name: 'chest_indescribable',
    title: '胸中说不出的难受',
    kind: 'symptom',
    comment: CH17 + '：病人胸中似喘不喘，似呕不呕，似哕不哕，彻心中愦愦然无奈者。',
    trigger: ['胸中说不出的难受', '似喘不喘似呕不呕', '心里烦乱说不清', '胸中愦愦然',
      '说不上来的难受', '心里乱得没办法', '胸口堵得说不出什么感觉'],
    negate: ['胸中舒服'],
    ask: '是不是胸口里有一种说不清的难受——像喘又不是喘、想吐又吐不出、想打嗝又打不出？'
  },
  {
    name: 'qi_li',
    title: '拉肚子还不停放屁',
    kind: 'symptom',
    comment: CH17 + '：气利，诃黎勒散主之（气利＝下利而矢气，大便随屁而出）。',
    trigger: ['拉肚子还不停放屁', '气利', '大便跟着屁出来', '一放屁就带出大便',
      '拉稀还排气多', '放屁带屎'],
    negate: ['不放屁'],
    ask: '是不是拉肚子的同时还不停放屁，大便跟着气一起出来？'
  }
]

// ---------- 证候 1 个 ----------
const SUMMARIES = [
  {
    name: 'wei_fan',
    title: '胃反',
    kind: 'summary',
    comment: CH17 + '：脾伤则不磨，朝食暮吐，暮食朝吐，宿谷不化，名曰胃反……胃反呕吐者，大半夏汤主之。',
    needs: [
      // 朝食暮吐、暮食朝吐 —— 胃反最核心的定义
      ['food_vomit_delayed.yes'],
      ['food_vomit_delayed.yes', 'low_appetite.yes'],
      ['food_vomit_delayed.yes', 'weight_loss.yes'],
      // 朝食暮吐 + 吐完口渴
      ['food_vomit_delayed.yes', 'thirsty.yes']
    ],
    contraindications: [
      '胃反就是「朝食暮吐，暮食朝吐」——早上吃的到晚上吐出来、晚上吃的早上吐出来，' +
      '吐出来的还是没消化的「宿谷不化」',
      '病机是脾胃虚寒、不能腐熟运化，所以吃下去的东西停在那里不动，隔很久才吐出来',
      '和一般呕吐的区别：一般呕吐是吃完不久就吐；胃反是**隔了一顿甚至半天**才吐',
      '原文还强调「脉紧而涩，其病难治」——病程长、消瘦明显的胃反比较难治',
      '⚠ 这种「隔餐呕吐、吐出宿食」的表现，现代要高度警惕**幽门梗阻**（溃疡瘢痕或肿瘤所致），必须做胃镜'
    ],
    ref: CH17 + ' · 朝食暮吐，暮食朝吐，宿谷不化，名曰胃反'
  }
]

// ---------- 方剂 11 个新建 ----------
const FORMULAS = [
  {
    name: 'zhuling_san',
    title: '猪苓散',
    kind: 'formula',
    comment: CH17 + '：呕吐而病在膈上，后思水者，解，急与之。思水者，猪苓散主之。',
    needs: [
      // 呕吐后口渴想喝水（吐伤了津液，但水饮仍未化）
      ['vomiting.yes', 'thirsty.yes'],
      ['vomiting.yes', 'thirsty.yes', 'urination_difficulty.yes']
    ],
    contraindications: [
      '治呕吐之后口渴想喝水的情况。原文说「后思水者，解，急与之」——吐完想喝水，是想好的征兆，赶紧给他喝',
      '但如果「思水」而水饮仍未化，就要用猪苓散：猪苓、茯苓、白术，利水健脾',
      '思路很妙：渴想喝水，可不能一味灌水（水停更吐），要用利水药把水引导下去',
      '做成散剂「饮服方寸匕，日三服」'
    ],
    ref: CH17 + ' · 呕吐而病在膈上，后思水者……思水者，猪苓散主之（猪苓、茯苓、白术各等分）'
  },
  {
    name: 'dabanxia_tang',
    title: '大半夏汤',
    kind: 'formula',
    comment: CH17 + '：胃反呕吐者，大半夏汤主之。',
    needs: [
      // 胃反（朝食暮吐）+ 虚象
      ['wei_fan.yes'],
      ['food_vomit_delayed.yes', 'low_energy.yes']
    ],
    contraindications: [
      '治胃反的正方：朝食暮吐、暮食朝吐、宿谷不化',
      '三味：半夏（重用二升，降逆止呕）、人参（补虚）、白蜜（润燥养胃）',
      '和吴茱萸汤的区别：吴茱萸汤偏肝胃虚寒、有头痛吐涎沫；大半夏汤偏脾胃虚弱、以「隔餐呕吐」为主',
      '原文服法很讲究：「以水一斗二升，和蜜扬之二百四十遍」，把蜜与水充分混合，取「甘缓濡润」之意',
      '⚠ 隔餐呕吐要排查幽门梗阻，做胃镜'
    ],
    ref: CH17 + ' · 胃反呕吐者，大半夏汤主之（半夏二升、人参三两、白蜜一升）'
  },
  {
    name: 'dahuang_gancao_tang',
    title: '大黄甘草汤',
    kind: 'formula',
    comment: CH17 + '：食已即吐者，大黄甘草汤主之。',
    needs: [
      // 一吃完就吐 —— 本方唯一且特异的靶点
      ['vomit_right_after_eating.yes'],
      ['vomit_right_after_eating.yes', 'constipation.yes']
    ],
    contraindications: [
      '治「食已即吐」——刚吃完马上就吐，和胃反的「隔很久才吐」正好相反',
      '只有两味：大黄、甘草。「食已即吐」是胃肠有实热、下窍不通，浊气上逆，' +
      '所以用大黄通下、甘草缓中，**大便一通、浊气下行，呕吐自止**',
      '这是「欲降先通」～「下病上取」的思路：治呕吐却用泻下药',
      '体虚、孕妇慎用；中病即止'
    ],
    ref: CH17 + ' · 食已即吐者，大黄甘草汤主之（大黄四两、甘草一两）'
  },
  {
    name: 'fuling_zexie_tang',
    title: '茯苓泽泻汤',
    kind: 'formula',
    comment: CH17 + '：胃反，吐而渴欲饮水者，茯苓泽泻汤主之。',
    needs: [
      // 胃反 + 吐后口渴想喝水（水饮内停、津不上承）
      ['food_vomit_delayed.yes', 'thirsty.yes'],
      ['vomiting.yes', 'thirsty.yes', 'dizziness.yes']
    ],
    contraindications: [
      '治胃反而「吐而渴欲饮水」——一边吐、一边又口渴想喝水，喝下去又可能再吐',
      '茯苓、泽泻、白术、桂枝、甘草、生姜——利水化气、温中降逆',
      '这是五苓散类方：核心是**水饮内停、气化不利**，所以既吐又渴',
      '和猪苓散的区别：猪苓散偏轻（吐后想水）；本方水饮更重，吐与渴并存',
      '和茯苓泽泻汤同名方在别处也有，注意本条是金匮原方'
    ],
    ref: CH17 + ' · 胃反，吐而渴欲饮水者，茯苓泽泻汤主之（茯苓半斤、泽泻四两、甘草、桂枝各二两、白术三两、生姜四两）'
  },
  {
    name: 'wenha_tang',
    title: '文蛤汤',
    kind: 'formula',
    comment: CH17 + '：吐后，渴欲得水而贪饮者，文蛤汤主之。兼主微风、脉紧、头痛。',
    needs: [
      // 吐后极度口渴贪饮 + 兼有外感
      ['vomiting.yes', 'severe_thirst.yes'],
      ['vomiting.yes', 'severe_thirst.yes', 'wind_aversion.yes']
    ],
    contraindications: [
      '治吐后「渴欲得水而贪饮」——吐完渴得厉害、贪喝不停',
      '组成是文蛤 + 麻黄杏仁甘草石膏汤：文蛤（海蛤壳）咸寒生津止渴，麻杏石甘汤清宣郁热',
      '原文还说「兼主微风、脉紧、头痛」——兼有表证头痛也能治',
      '和文蛤散的区别：文蛤散只治「渴欲饮水不止」（单纯津伤）；本方兼有内热与表证',
      '注意：本方偏寒凉，虚寒者不宜'
    ],
    ref: CH17 + ' · 吐后，渴欲得水而贪饮者，文蛤汤主之（文蛤五两、麻黄、甘草、生姜各三两、石膏五两、杏仁五十个、大枣十二枚）'
  },
  {
    name: 'banxia_ganjiang_san',
    title: '半夏干姜散',
    kind: 'formula',
    comment: CH17 + '：干呕，吐逆，吐涎沫，半夏干姜散主之。',
    needs: [
      // 干呕 + 吐涎沫 + 偏寒（干姜温中）
      ['vomiting.yes', 'saliva_spit.yes', 'cold_aversion.yes'],
      ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治寒性的干呕、吐涎沫：吐的是清稀涎沫，不是食物，伴怕冷',
      '只有两味：半夏（降逆止呕）、干姜（温中散寒），等分为散',
      '原文服法「取方寸匕，浆水一升半，煎取七合，顿服之」——浆水助其和胃',
      '和小半夏汤的区别：小半夏汤是半夏+生姜，偏散饮止呕；本方是半夏+干姜，**偏温中**，适合胃寒明显者',
      '和干姜人参半夏丸（妊娠呕吐）也不同，那条有虚证'
    ],
    ref: CH17 + ' · 干呕，吐逆，吐涎沫，半夏干姜散主之（半夏、干姜等分）'
  },
  {
    name: 'shengjiang_banxia_tang',
    title: '生姜半夏汤',
    kind: 'formula',
    comment: CH17 + '：病人胸中似喘不喘，似呕不呕，似哕不哕，彻心中愦愦然无奈者，生姜半夏汤主之。',
    needs: [
      // 「说不出什么感觉的难受」—— 本方唯一的靶点
      ['chest_indescribable.yes'],
      ['chest_indescribable.yes', 'vomiting.yes'],
      ['chest_indescribable.yes', 'chest_qi_stuffiness.yes']
    ],
    contraindications: [
      '治一种「说不清」的不适：像喘又不是喘、想吐又吐不出、想打嗝又打不出，' +
      '心里烦乱得无可奈何（原文：彻心中愦愦然无奈）',
      '只有两味：生姜（重用，取汁）、半夏。生姜用量比小半夏汤更大，取「散饮力猛」之意',
      '原文服法讲究：「以水三升，煮半夏取二升，内生姜汁，煮取一升半，小冷，分四服」——' +
      '**放温凉一点、分四次慢慢喝**，避免一次喝多反而更呕',
      '和小半夏汤的区别：小半夏汤治「呕而不渴」；本方治「欲呕不呕」的闷乱感'
    ],
    ref: CH17 + ' · 病人胸中似喘不喘，似呕不呕，似哕不哕，彻心中愦愦然无奈者，生姜半夏汤主之'
  },
  {
    name: 'jupi_tang',
    title: '橘皮汤',
    kind: 'formula',
    comment: CH17 + '：干呕、哕，若手足厥者，橘皮汤主之。',
    needs: [
      // 打嗝 + 手足发凉（气逆导致阳气不达四末）
      ['hiccup.yes', 'cold_extremities.yes'],
      ['hiccup.yes', 'vomiting.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '治干呕、打嗝而手足发凉的情况',
      '只有两味：橘皮（行气降逆）、生姜（散寒止呕）',
      '手足发凉的机理很有意思：**不是阳虚，而是气逆阻隔**，阳气被堵在里面送不到四肢。' +
      '所以气一降、手足自然回暖，原文说「温服一升，下咽即愈」',
      '和四逆汤的区别：四逆汤是真阳虚、手足厥冷伴下利清谷；本方是气逆导致的厥，没有虚寒下利'
    ],
    ref: CH17 + ' · 干呕、哕，若手足厥者，橘皮汤主之（橘皮四两、生姜半斤）'
  },
  {
    name: 'jupi_zhuru_tang',
    title: '橘皮竹茹汤',
    kind: 'formula',
    comment: CH17 + '：哕逆者，橘皮竹茹汤主之。',
    needs: [
      // 打嗝不止 + 偏虚（人参、大枣、甘草补虚）
      ['hiccup.yes', 'low_energy.yes'],
      ['hiccup.yes', 'hiccup.yes']
    ],
    contraindications: [
      '治「哕逆」——打嗝连声不断，偏胃虚有热',
      '六味：橘皮、竹茹（降逆清热）、大枣、生姜、甘草、人参（补虚）',
      '和橘皮汤的区别：橘皮汤药少力专、治实(气逆+手足厥)；本方**有人参补虚**，治虚证打嗝',
      '橘皮与竹茹是治哕的经典配伍，后世治呃逆几乎都从这首方化出',
      '原文说「哕逆者」——强调是虚性的、连声不止的打嗝'
    ],
    ref: CH17 + ' · 哕逆者，橘皮竹茹汤主之（橘皮二升、竹茹二升、大枣三十枚、生姜半斤、甘草五两、人参一两）'
  },
  {
    name: 'zishen_tang',
    title: '紫参汤',
    kind: 'formula',
    comment: CH17 + '：下利肺痛，紫参汤主之。',
    needs: [
      // 下利 + 胸肺作痛
      ['diarrhea.yes', 'chest_back_pain.yes'],
      ['diarrhea.yes', 'chest_qi_stuffiness.yes']
    ],
    contraindications: [
      '治「下利肺痛」——一边拉肚子、一边胸肺部位疼痛',
      '只有两味：紫参（即拳参，清热解毒、凉血止痢）、甘草',
      '「肺痛」的病机解释不一：有认为是肺与大肠相表里、肠中热毒上攻于肺；也有认为「肺」是「腹」之误',
      '紫参现代多用于痢疾、肠炎，属清热解毒类',
      '⚠ 本条历来有争议，实际用药须由医师判断'
    ],
    ref: CH17 + ' · 下利肺痛，紫参汤主之（紫参半斤、甘草三两）'
  },
  {
    name: 'heliie_san',
    title: '诃黎勒散',
    kind: 'formula',
    comment: CH17 + '：气利，诃黎勒散主之。诃梨勒十枚。',
    needs: [
      // 气利：下利而矢气，大便随屁而出
      ['qi_li.yes'],
      ['qi_li.yes', 'diarrhea.yes']
    ],
    contraindications: [
      '治「气利」——拉肚子时不停放屁，大便跟着气一起出来，控制不住',
      '只有一味：诃黎勒（诃子），煨用，「为散，粥饮和，顿服」',
      '诃子酸涩收敛，专于涩肠止泻、固气下陷',
      '和赤石脂禹余粮汤的区别：那条是滑脱不禁、重在固涩；本方兼有理气（气利＝气与便同下）',
      '⚠ 气利多属久利气虚下陷，若有实邪积滞则不宜单纯收敛'
    ],
    ref: CH17 + ' · 气利，诃黎勒散主之（诃梨勒十枚，煨，为散，粥饮和，顿服）'
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
  let out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
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
  const jobs = [
    ['wuzhuyu_tang',
      [['vomiting.yes', 'chest_fullness.yes'], ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes']]],
    ['banxia_xiexin_tang',
      [['vomiting.yes', 'borborygmus.yes', 'epigastric_lump_soft.yes']]],
    ['huangqin_jia_banxia_shengjiang_tang',
      [['vomiting.yes', 'diarrhea.yes']]],
    ['xiaobanxia_tang',
      [['vomiting.yes', 'low_appetite.yes']]],
    ['xiaochaihu_tang',
      [['vomiting.yes', 'fever.yes']]],
    ['taohua_tang',
      [['stool_blood.yes', 'diarrhea.yes']]],
    ['baitouweng_tang',
      [['diarrhea.yes', 'tenesmus.yes', 'fever.yes']]],
    ['zhizi_chi_tang',
      [['diarrhea.yes', 'restless.yes', 'epigastric_lump_soft.yes']]],
    ['tongmai_sini_tang',
      [['diarrhea.yes', 'cold_extremities.yes', 'sweat.yes']]],
    ['xiaochengqi_tang',
      [['diarrhea.yes', 'delirium.yes']]],
    ['dachengqi_tang',
      [['diarrhea.yes', 'epigastric_lump_soft.yes']]]
  ]
  // 过滤掉含占位符的坏路径
  for (const [id, paths] of jobs) {
    const clean = paths.filter(p => p.every(c => /^[a-z0-9_]+\.(yes|no)$/.test(c) && registry[c.split('.')[0]]))
    if (clean.length !== paths.length) console.log('   ⚠ ' + id + ' 有无效条件，已跳过该条')
    if (clean.length) {
      const note = '    // 金匮第十七篇 呕吐哕下利 对应条文'
      console.log(appendPath(id, clean, note))
    }
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
