'use strict'
// tools/apply-jingui-huyao.js
// 金匮批 5：第三篇 狐惑病 / 赤小豆当归散 / 阴阳毒（金匮 3.10 ~ 3.15）
//
// 口径（与前几批一致）：
//   · **白话优先**：标题、反问话术、说明写成高中生能看懂的大白话；
//     文言只在 provenance 注释里留原文
//   · 要素按事实，不强制数量/阴性；AND 里只放该方关键症状
//   · 病机写进 contraindications，不进 needs
//   · 症状节点原子化：一个症状一个节点，同义口语全塞 trigger
//   · 脉象不做（脉数/脉微数一律不入 needs）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH3 = '金匮要略·百合病狐惑阴阳毒病脉证并治第三'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'eyes_cannot_close',
    title: '眼睛闭不上',
    kind: 'symptom',
    comment: CH3 + '：默默欲眠，目不得闭。',
    trigger: ['眼睛闭不上', '眼睛合不上', '想闭眼闭不上', '睡觉眼睛闭不严', '眼睛合不拢', '眼皮合不上'],
    negate: ['眼睛能闭上', '眼睛闭得上'],
    ask: '是不是想闭眼睛歇一会儿，可眼皮合不上、眼睛闭不严？'
  },
  {
    name: 'voice_hoarse',
    title: '声音嘶哑',
    kind: 'symptom',
    comment: CH3 + '：蚀于上部则声喝（喝=声音嘶哑）。',
    trigger: ['声音嘶哑', '嗓子哑', '说话嘶哑', '声音哑', '嗓子嘶哑', '说话没声', '说话沙哑'],
    negate: ['声音正常', '嗓子不哑', '说话不哑'],
    ask: '是不是说话声音变沙哑了，发不出清亮的声音？'
  },
  {
    name: 'genital_ulcer',
    title: '前阴溃烂',
    kind: 'symptom',
    comment: CH3 + '：蚀于阴为狐。',
    trigger: ['前阴溃烂', '阴部溃烂', '外阴溃烂', '下身溃烂', '阴部溃疡', '下面溃烂', '阴部长疮', '前阴长疮'],
    negate: ['阴部正常', '下身没事'],
    ask: '是不是前阴（下身）那里有溃烂、破皮、长疮的地方？'
  },
  {
    name: 'anal_ulcer',
    title: '肛门溃烂',
    kind: 'symptom',
    comment: CH3 + '：蚀于肛者，雄黄熏之。',
    trigger: ['肛门溃烂', '肛门溃疡', '肛口溃烂', '肛周溃烂', '肛门口溃烂', '肛门长疮'],
    negate: ['肛门正常', '肛门没事'],
    ask: '是不是肛门那里有溃烂、破皮的地方？'
  },
  {
    name: 'face_color_fluctuating',
    title: '脸色忽红忽黑忽白',
    kind: 'symptom',
    comment: CH3 + '：其面目乍赤、乍黑、乍白。',
    trigger: ['脸色忽红忽黑', '脸色忽红忽白', '脸红一阵黑一阵', '脸色变来变去', '面色忽赤忽黑', '脸一会儿红一会儿白', '脸色一会儿红一会儿白', '脸上颜色忽深忽浅'],
    negate: ['脸色一直正常'],
    ask: '是不是脸色一阵子发红、一阵子发黑、一阵子发白，来回变？'
  },
  {
    name: 'eyes_dark_rims',
    title: '眼眶四周发黑',
    kind: 'symptom',
    // 金匮 3.13 目四眦黑 —— 与「目赤如鸠眼」前后并列，是狐惑化脓的眼部表现
    comment: CH3 + '：初得之三、四日，目赤如鸠眼；七、八日，目四眦黑。',
    trigger: ['眼眶发黑', '眼圈发黑', '眼睛四周发黑', '黑眼圈很重', '眼周发黑', '眼角发黑', '眼睛周围发黑'],
    negate: ['眼圈不黑', '眼眶不黑'],
    ask: '是不是眼睛四周（眼圈、眼角）发黑，像画了个黑圈？'
  },
  {
    name: 'face_red_patches',
    title: '脸上红斑如锦纹',
    kind: 'symptom',
    comment: CH3 + '：阳毒之为病，面赤斑斑如锦纹。',
    trigger: ['脸上红斑', '面部红斑', '脸上红一块一块', '脸上起红斑', '脸上斑斑发红', '面上红斑成片', '脸上红片片'],
    negate: ['脸上没有红斑', '脸上干干净净'],
    ask: '是不是脸上有一片一片的红斑，花纹样、红得不均匀？'
  },
  {
    name: 'throat_dry',
    title: '嗓子发干',
    kind: 'symptom',
    comment: CH3 + '：蚀于下部则咽干。',
    trigger: ['嗓子发干', '喉咙发干', '咽干', '嗓子干', '喉咙干燥', '嗓子眼干'],
    negate: ['嗓子不干', '喉咙不干'],
    ask: '是不是嗓子发干、发涩，喝水也润不过来？'
  }
]

// ---------- 证候 3 个 ----------
const SUMMARIES = [
  {
    name: 'hu_huo_bing',
    title: '狐惑病',
    kind: 'summary',
    comment: CH3 + '：狐蜮之为病，状如伤寒，默默欲眠，目不得闭，卧起不安，蚀于喉为蜮，蚀于阴为狐，不欲饮食，恶闻食臭，其面目乍赤、乍黑、乍白。',
    needs: [
      // 想睡却闭不上眼：狐惑最标志性的一组
      ['eyes_cannot_close.yes', 'sleepy.yes'],
      // 蚀于喉：咽喉溃烂 + 声音嘶哑
      ['throat_ulcer.yes', 'voice_hoarse.yes'],
      // 蚀于前后阴
      ['genital_ulcer.yes', 'anal_ulcer.yes'],
      // 脸色忽赤忽黑忽白 + 想睡闭不上眼
      ['face_color_fluctuating.yes', 'eyes_cannot_close.yes']
    ],
    contraindications: [
      '狐惑病的样子很像外感伤寒（发热、没劲、不想吃饭），但又不是伤寒，查不出外感的原因',
      '最典型的是「想睡却闭不上眼」——很困、眼皮合不上，睡也睡不踏实',
      '再有就是黏膜溃烂：烂在喉咙叫「蜮」（会声音嘶哑），烂在前后阴叫「狐」（原文叫蚀于阴为狐）',
      '整个病程里脸色会忽红、忽黑、忽白地变来变去',
      '病机是湿热虫毒蕴结，不是单纯虚证，别一味补',
      '主方甘草泻心汤；烂在下身用苦参汤外洗，烂在肛门用雄黄熏'
    ],
    ref: CH3 + ' · 狐蜮之为病，状如伤寒，默默欲眠，目不得闭'
  },
  {
    name: 'yang_du',
    title: '阳毒',
    kind: 'summary',
    comment: CH3 + '：阳毒之为病，面赤斑斑如锦纹，咽喉痛，唾脓血。',
    needs: [
      ['face_red_patches.yes', 'throat_pain.yes', 'tu_nongxue.yes']
    ],
    contraindications: [
      '阳毒是疫毒热邪暴发的一种急重病：脸上起一片片红斑像锦缎花纹，咽喉剧痛，咳吐脓血',
      '热毒极盛、来势很凶，原文说「五日可治，七日不可治」——要尽早处理',
      '不是普通上火，也不是一般外感发热'
    ],
    ref: CH3 + ' · 阳毒之为病，面赤斑斑如锦纹，咽喉痛，唾脓血'
  },
  {
    name: 'yin_du',
    title: '阴毒',
    kind: 'summary',
    comment: CH3 + '：阴毒之为病，面目青，身痛如被杖，咽喉痛。',
    needs: [
      ['poor_complexion.yes', 'body_pain.yes', 'throat_pain.yes']
    ],
    contraindications: [
      '阴毒同样是疫毒急重病，但偏寒、偏阴：脸色和眼睛周围发青，身上痛得像被棍子打过，咽喉也痛',
      '和阳毒区别在于：阳毒面红起斑、吐脓血；阴毒面青、身痛剧烈、没有斑和脓血',
      '同样是「五日可治，七日不可治」，要早处理'
    ],
    ref: CH3 + ' · 阴毒之为病，面目青，身痛如被杖，咽喉痛'
  }
]

// ---------- 方剂 ----------
const FORMULAS = [
  {
    name: 'kushen_tang_xi',
    title: '苦参汤（外洗）',
    kind: 'formula',
    comment: CH3 + '：蚀于下部则咽干，苦参汤洗之。',
    // 外治法：烂在前阴（下部），同时因热上冲而嗓子发干
    needs: [['genital_ulcer.yes', 'throat_dry.yes']],
    contraindications: [
      '狐惑病溃烂在前阴（下身）的时候用，是外洗方，不是喝的',
      '原文还配了一句「蚀于下部则咽干」——下面的湿热上冲，嗓子跟着发干',
      '苦参清热燥湿杀虫，煎汤熏洗患处'
    ],
    ref: CH3 + ' · 蚀于下部则咽干，苦参汤洗之'
  },
  {
    name: 'xionghuang_xun',
    title: '雄黄熏法',
    kind: 'formula',
    comment: CH3 + '：蚀于肛者，雄黄熏之。',
    needs: [['anal_ulcer.yes']],
    contraindications: [
      '狐惑病溃烂在肛门的时候用，是拿雄黄烧烟熏患处的外治法',
      '雄黄有毒，只可外用熏，绝不能内服',
      '熏的时候注意别烫伤，也别吸太多烟'
    ],
    ref: CH3 + ' · 蚀于肛者，雄黄熏之'
  },
  {
    name: 'chixiaodou_dangui_san',
    title: '赤小豆当归散',
    kind: 'formula',
    comment: CH3 + '：病者脉数，无热，微烦，默默但欲卧，汗出，初得之三、四日，目赤如鸠眼；七、八日，目四眦黑。若能食者，脓已成也，赤小豆当归散主之。',
    // 关键：脉数却不发热、出汗、眼睛红像鸽子眼 → 眼眶四周发黑 → 已成脓
    needs: [
      ['eyes_dark_rims.yes', 'sweat.yes'],
      ['eyes_dark_rims.yes', 'mu_chi.yes']
    ],
    contraindications: [
      '这是狐惑病发展成「化脓」的阶段：脉搏快却不发烧，人有点烦、老想躺着，还出汗',
      '眼睛先红得像鸽子眼，七八天后眼眶四周发黑——原文说这是脓已经形成了',
      '「若能食者」意思是胃口回来了，说明脓已成熟、可以排了',
      '赤小豆清热排脓、当归活血，是排脓生肌的思路（同方也用于肠痈、痔疮出血）'
    ],
    ref: CH3 + ' · 目赤如鸠眼；七、八日，目四眦黑。若能食者，脓已成也，赤小豆当归散主之'
  },
  {
    name: 'shengma_biejia_tang',
    title: '升麻鳖甲汤',
    kind: 'formula',
    comment: CH3 + '：阳毒之为病……升麻鳖甲汤主之。',
    needs: [['yang_du.yes']],
    contraindications: [
      '阳毒（面起红斑如锦纹、咽喉剧痛、吐脓血）的主方',
      '升麻、甘草解毒清热，鳖甲、当归凉血散瘀，蜀椒、雄黄取「以毒攻毒」之意',
      '原文明说五日可治、七日不可治，越早越好',
      '雄黄有毒，须严格按原方用量，不可久服'
    ],
    ref: CH3 + ' · 阳毒之为病……升麻鳖甲汤主之'
  },
  {
    name: 'shengma_biejia_tang_qu',
    title: '升麻鳖甲汤去雄黄蜀椒',
    kind: 'formula',
    comment: CH3 + '：阴毒之为病……升麻鳖甲汤去雄黄、蜀椒主之。',
    needs: [['yin_du.yes']],
    contraindications: [
      '阴毒（面目青、身痛如被杖、咽喉痛）用升麻鳖甲汤，但要去掉雄黄和蜀椒',
      '阴毒偏寒偏阴，雄黄、蜀椒这两味辛热峻烈，去掉以免更伤阴血',
      '其余升麻、鳖甲、当归、甘草照用，解毒散瘀而不助热'
    ],
    ref: CH3 + ' · 阴毒之为病……升麻鳖甲汤去雄黄、蜀椒主之'
  }
]

// ---------- 既有节点的触发词补丁 ----------
const TRIGGER_PATCH = [
  { file: 'sleepy', add: ['默默欲眠', '总想睡', '老想躺着', '想睡又睡不踏实'] },
  { file: 'body_pain', add: ['身痛如被杖', '身上像被打过', '浑身像挨了一顿打'] },
  { file: 'poor_complexion', add: ['面目青', '脸色发青', '面青'] },
  { file: 'restless', add: ['微烦', '心里微微发烦'] },
  { file: 'mu_chi', add: ['目赤如鸠眼', '眼睛红得像鸽子眼'] },
  { file: 'low_appetite', add: ['恶闻食臭', '闻到饭味就难受'] }
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

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

function patchTrigger(file, add) {
  const p = path.join(PLUGINS, 'symptoms', file + '.js')
  let src = fs.readFileSync(p, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  if (!m) return '   ⚠ ' + file + ' 找不到关键词数组，跳过'
  const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = add.filter(k => !existing.includes(k))
  if (!fresh.length) return '   = ' + file + ' 无需补词'
  const merged = existing.concat(fresh).map(k => "'" + k + "'").join(', ')
  src = src.replace(m[0], '[' + merged + '].some')
  fs.writeFileSync(p, src, 'utf8')
  return '   ＋ ' + file + ' 补触发词 ' + fresh.join('、')
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

  // 甘草泻心汤已有（伤寒 158 条），追加狐惑病那条路径
  const gx = path.join(PLUGINS, 'formulas', 'gancao_xiexin_tang.js')
  let gsrc = fs.readFileSync(gx, 'utf8')
  if (!gsrc.includes('hu_huo_bing.yes')) {
    gsrc = gsrc.replace("['epigastric_lump_soft.yes', 'vomiting.yes', 'restless.yes']",
      "['epigastric_lump_soft.yes', 'vomiting.yes', 'restless.yes'],\n    // 金匮 3.10：狐惑病蚀于上部则声喝，甘草泻心汤主之\n    ['hu_huo_bing.yes', 'voice_hoarse.yes']")
    gsrc = gsrc.replace("'补虚消痞止利'", "'补虚消痞止利', '狐惑病蚀于喉、声音嘶哑'")
    fs.writeFileSync(gx, gsrc, 'utf8')
    console.log('  ~ 方剂 gancao_xiexin_tang 追加狐惑病路径')
  }

  console.log('\n=== 既有节点补触发词 ===')
  for (const p of TRIGGER_PATCH) console.log(patchTrigger(p.file, p.add))

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  prov.nodes['gancao_xiexin_tang'] = {
    source: 'shanghanlun', label: '伤寒论第158条 + 金匮要略第三篇',
    refs: [
      '伤寒论·第158条：伤寒中风，医反下之，其人下利日数十行，谷不化，腹中雷鸣，心下痞硬而满，干呕心烦不得安……甘草泻心汤主之',
      '金匮要略·百合病狐惑阴阳毒病脉证并治第三：蚀于上部则声喝，甘草泻心汤主之'
    ], by: 'system:jinkui'
  }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：8 症状 + 3 证候 + 5 方剂 + 1 方剂追加路径 + provenance')
} else {
  for (const x of NEW_SYMPTOMS) { console.log('\n=== 症状 ' + x.name + '（' + x.title + '）==='); console.log('问：' + x.ask) }
  for (const s of SUMMARIES) {
    console.log('\n=== 证候 ' + s.name + '（' + s.title + '）===')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n=== 方剂 ===')
  for (const f of FORMULAS) { console.log('  ' + f.title.padEnd(22) + JSON.stringify(f.needs)) }
  console.log('\n=== 既有节点补词 ===')
  for (const p of TRIGGER_PATCH) console.log('  ' + p.file + ' + ' + p.add.join('、'))
  console.log('\n（预览，加 --write 落库）')
}
