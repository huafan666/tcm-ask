'use strict'
// tools/apply-jingui-2-22-2-26.js
// 金匮批 2：湿病/暍病 方证（按用户 9 条意见）
//
//   node tools/apply-jingui-2-22-2-26.js            # 预览
//   node tools/apply-jingui-2-22-2-26.js --write    # 写盘
//
// 用户定的原则（本批严格遵守）：
//   · 要素数量按事实来，不强制 3~5
//   · 阴性要素按事实来，不强制
//   · AND 里只放「这个方剂的关键症状」——像呕这种伴随症状不进条件
//   · 病机说明与症状条件拆开：条件只写症状，病机写进 contraindications
//   · 现代病理佐证只作说明与 trigger 口语词，不进 needs
//   · 大便坚用现有 constipation（临床即便秘），不新建
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

const CH2 = '金匮要略·痉湿暍病脉证并治第二'

// ---------- 新建症状（都是原文里的关键要素）----------
const NEW_SYMPTOMS = [
  {
    name: 'press_pain_aggravated',
    title: '按之痛剧',
    kind: 'symptom',
    comment: CH2 + '：风湿相搏，骨节疼烦掣痛，不得屈伸，近之则痛剧。',
    trigger: ['按之痛剧', '一碰就痛', '碰到就痛得厉害', '轻触即痛', '不让碰'],
    negate: ['按着不痛', '碰了也不痛'],
    ask: '是不是那个地方一碰就痛得厉害，连被子压着都难受？'
  },
  {
    name: 'short_breath',
    title: '短气',
    kind: 'symptom',
    comment: CH2 + '：风湿相搏，骨节疼烦掣痛，不得屈伸，近之则痛剧，汗出短气。',
    trigger: ['短气', '气短', '气不够用', '呼吸跟不上', '气接不上'],
    negate: ['不气短', '呼吸顺畅'],
    ask: '是不是觉得气不够用、呼吸跟不上，但又不算真正喘？'
  },
  {
    name: 'mild_edema',
    title: '身微肿',
    kind: 'symptom',
    comment: CH2 + '：风湿相搏……汗出短气，小便不利，恶风不欲去衣，或身微肿者，甘草附子汤主之。',
    trigger: ['身微肿', '有点浮肿', '轻微浮肿', '按下去有坑', '皮肤发胀'],
    negate: ['不肿', '没有浮肿'],
    ask: '是不是身上或腿上有点轻微浮肿，按下去会留个坑？'
  }
]

// ---------- 新建方剂：防己黄芪汤 ----------
const NEW_FORMULA = {
  name: 'fangji_huangqi_tang',
  title: '防己黄芪汤',
  kind: 'formula',
  comment: CH2 + '：风湿，脉浮身重，汗出恶风者，防己黄耆汤主之。',
  // 原文三要素，全是关键症状；脉浮不做
  needs: [['body_heavy.yes', 'sweat.yes', 'wind_aversion.yes']],
  contraindications: [
    '风湿在表、表虚不固、水湿不化（身重是水湿停聚，汗出恶风是表虚）',
    '主方防己黄芪汤：益气固表、利水除湿',
    '脉浮身为外证；本项目脉象暂不入判定',
    '与麻黄加术汤区别：本方有汗出恶风（表虚），麻黄加术汤无汗（表实）'
  ],
  ref: CH2 + ' · 风湿，脉浮身重，汗出恶风者，防己黄耆汤主之'
}

// ---------- 收紧 / 补充已有方剂的路径 ----------
const PATCHES = [
  {
    name: 'guizhi_fuzi_tang',
    // 旧：['body_ache_stiff.yes']（单要素，太松）→ 按原文补上关键鉴别「不渴」
    needs: [
      ['body_ache_stiff.yes', 'thirsty.no'],
      ['body_ache_stiff.yes', 'joint_pain_rigid.yes', 'thirsty.no']
    ],
    contraindications: [
      '风湿在表、表阳虚（身体疼烦、不能自转侧）',
      '不渴是排除里热的关键鉴别（原文「不呕不渴」；呕属伴随症，不进条件）',
      '与去桂加白术汤的区别：本方无大便坚；大便坚而小便自利者去桂加白术',
      '温经散寒除湿（桂枝+附子）'
    ]
  },
  {
    name: 'qugui_jia_baizhu_tang',
    // 补上原文的真正鉴别点「大便坚」（用现有 constipation）
    needs: [
      ['body_ache_stiff.yes', 'constipation.yes', 'easy_urination.yes']
    ],
    contraindications: [
      '风湿兼里湿（湿胜于风）：身体疼烦不能转侧 + 大便坚 + 小便自利',
      '大便坚、小便自利是去桂加白术的唯一鉴别点（与桂枝附子汤只差这一处）',
      '去桂加白术：重在祛湿健脾'
    ]
  },
  {
    name: 'gancao_fuzi_tang',
    // 旧：['joint_pain_rigid.yes']（单要素）+ 加小便不利；按原文补「按之痛剧」「恶风」
    needs: [
      ['joint_pain_rigid.yes', 'press_pain_aggravated.yes', 'urination_difficulty.yes', 'wind_aversion.yes'],
      ['joint_pain_rigid.yes', 'urination_difficulty.yes', 'short_breath.yes', 'mild_edema.yes']
    ],
    contraindications: [
      '风湿最重、表里阳气俱虚：骨节疼烦掣痛不得屈伸',
      '近之则痛剧（按之痛剧）是本方区别于普通关节痛的关键体征',
      '小便不利 + 短气 + 身微肿 = 阳虚不能化气行水',
      '温经散寒、助阳化湿（甘草附子汤）'
    ]
  },
  {
    name: 'baihu_jia_renshen',
    // 现有路径是伤寒26条（大烦渴+不恶寒）；这里加一条暍病路径（原文「汗出恶寒身热而渴」）
    addPath: ['sweat.yes', 'cold_aversion.yes', 'fever.yes', 'thirsty.yes'],
    addContra: CH2 + '：太阳中热者，暍是也。汗出恶寒，身热而渴，白虎加人参汤主之（暍病：暑热逼津外泄、汗多肌疏故恶寒）'
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
if (registry[NEW_FORMULA.name] && !FORCE) errors.push(NEW_FORMULA.name + ' 已存在（--force 可覆盖）')
for (const s of NEW_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const p of PATCHES) if (!registry[p.name]) errors.push(p.name + ' 不存在')
for (const p of NEW_FORMULA.needs) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep] && !NEW_SYMPTOMS.some(s => s.name === dep)) errors.push('防己黄芪汤 引用不存在的节点 ' + dep)
}
for (const p of PATCHES) {
  for (const path1 of (p.needs || [])) for (const c of path1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !NEW_SYMPTOMS.some(s => s.name === dep)) errors.push(p.name + ' 引用不存在的节点 ' + dep)
  }
  for (const c of (p.addPath || [])) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(p.name + ' 新增路径引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

// 触发词撞车检查
console.log('=== 触发词查重 ===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      if (name === s.name) continue
      for (const other of kwsOf(registry[name])) {
        if (other === kw || other.includes(kw) || kw.includes(other)) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name + ' 的「' + other + '」重叠'); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处（需人工判断）' : '  没有撞车 ✓')

// ---------- 生成 ----------
function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 症状 ' + s.name + '（' + s.title + '）')
  }
  if (!registry[NEW_FORMULA.name] || FORCE) {
    fs.writeFileSync(path.join(PLUGINS, 'formulas', NEW_FORMULA.name + '.js'), render(NEW_FORMULA), 'utf8')
    console.log('  ＋ 方剂 ' + NEW_FORMULA.name + '（' + NEW_FORMULA.title + '）')
  }
  for (const p of PATCHES) {
    const def = registry[p.name]
    const abs = path.join(PLUGINS, def.dir, def.file)
    const before = fs.readFileSync(abs, 'utf8')
    const cur = P.scanPluginSource(before).model
    let needs = p.needs ? p.needs.map(x => x.map(P.condToRef)) : cur.needs.map(x => x.slice())
    if (p.addPath) {
      const sig = JSON.stringify(p.addPath)
      const exists = needs.some(x => JSON.stringify(x.map(c => c.ref + '.' + c.pol)) === JSON.stringify(p.addPath))
      if (exists) console.log('  · ' + p.name + ' 已有这条路径，跳过')
      else { needs.push(p.addPath.map(P.condToRef)); }
    }
    const contra = (cur.contraindications || []).slice()
    if (p.contraindications) { contra.length = 0; contra.push.apply(contra, p.contraindications) }
    if (p.addContra && !contra.includes(p.addContra)) contra.push(p.addContra)
    const r = P.patchPluginSource(before, { needs, contraindications: contra })
    if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('  ✎ ' + p.name + ' 路径/禁忌已更新') }
    else console.log('  · ' + p.name + ' 无需改动')
    for (const n of r.notes) console.log('    note: ' + n)
  }
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  const ref = NEW_FORMULA.ref
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原方', refs: [s.comment.replace(/^金匮要略·[^：]*：/, '')], by: 'system:jinkui' }
  prov.nodes[NEW_FORMULA.name] = { source: 'jinkui', label: '金匮要略原方', refs: [ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：3 症状 + 1 方剂 + 4 个方剂的路径改动 + provenance')
} else {
  for (const s of NEW_SYMPTOMS) { console.log('\n=== plugins/symptoms/' + s.name + '.js ==='); console.log(render(s)) }
  console.log('\n=== plugins/formulas/' + NEW_FORMULA.name + '.js ===')
  console.log(render(NEW_FORMULA))
  console.log('\n=== 路径改动 ===')
  for (const p of PATCHES) {
    console.log('  ' + p.name + ' → ' + (p.needs ? JSON.stringify(p.needs) : '(保留原路径) + ' + JSON.stringify(p.addPath)))
  }
  console.log('\n（预览，加 --write 落库）')
}
