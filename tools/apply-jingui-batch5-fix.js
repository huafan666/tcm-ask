'use strict'
// tools/apply-jingui-batch5-fix.js —— 批 5 收尾修订（按用户 4 条决定）
//
// 决定 1：狐惑病「蚀于前阴」和「蚀于后阴（肛门）」拆成两条独立路径
//         【症状123 + 前阴溃烂】 OR 【症状123 + 肛门溃烂】
// 决定 2：赤小豆当归散按「脓已成」的临床原理补一条路径（脉快不发热 + 微烦 + 眼眶发黑）
// 决定 3：脸色青/赤/黄/白/黑 各建独立节点（阴毒改用 face_blue）
// 决定 4：删除 4 个没有 needs 的死证候节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH3 = '金匮要略·百合病狐惑阴阳毒病脉证并治第三'

// ---------- 决定 3：面色族（青赤黄白黑）----------
// 面赤已有 mian_chi（面赤/脸红/满面通红），这里补另外四色。
// poor_complexion 保留为「笼统气色差」的伞形节点不动，避免影响大承气汤等
// 用 poor_complexion.no 做鉴别的方剂；颜色词同时点亮伞形和具体节点是无害的（路径间 OR）。
const NEW_SYMPTOMS = [
  {
    name: 'face_blue',
    title: '面色发青',
    kind: 'symptom',
    comment: CH3 + '：阴毒之为病，面目青。',
    trigger: ['脸色发青', '面色发青', '面目青', '脸发青', '脸色青紫', '嘴唇发青', '脸发青白', '面色青紫'],
    negate: ['脸色正常', '面色不青'],
    ask: '是不是脸色（连着眼睛周围）发青、发暗？'
  },
  {
    name: 'face_pale',
    title: '面色苍白',
    kind: 'symptom',
    comment: '面色白：虚寒、血少、阳气不足时脸色发白无血色。',
    trigger: ['脸色苍白', '面色苍白', '脸发白', '脸色发白', '面白', '惨白', '没血色', '面色㿠白'],
    negate: ['脸色红润', '面色红润'],
    ask: '是不是脸色发白、苍白，没有血色？'
  },
  {
    name: 'face_yellow',
    title: '面色萎黄',
    kind: 'symptom',
    // 与 jaundice（皮肤眼睛发黄、橘子色）区分：这里只是脸色发黄发暗、没有眼白发黄
    comment: '面色黄：脾虚湿困、血虚时面色发黄发暗（萎黄），与黄疸的「身目俱黄」不同。',
    trigger: ['面色萎黄', '脸色萎黄', '面色发黄', '脸色发黄', '面黄', '脸色黄暗', '脸色蜡黄', '面色黄暗'],
    negate: ['脸色不黄'],
    ask: '是不是脸色发黄、发暗、没光泽（但眼白不黄）？'
  },
  {
    name: 'face_black',
    title: '面色发黑',
    kind: 'symptom',
    comment: '面色黑：肾虚、瘀血、水饮时面色黧黑、暗沉。',
    trigger: ['面色发黑', '脸色发黑', '面色黧黑', '脸色暗黑', '脸发黑', '面色晦暗', '脸色灰黑', '黑眼圈很重面色暗'],
    negate: ['脸色不黑'],
    ask: '是不是脸色发黑、发暗、灰蒙蒙的？'
  }
]

// ---------- 决定 1：狐惑病路径重写 ----------
// 「症状123」= 条文里最前三个症状：默默欲眠（想睡）、目不得闭（眼睛闭不上）、不欲饮食
const HUHUO_NEEDS = [
  ['eyes_cannot_close.yes', 'sleepy.yes'],
  ['throat_ulcer.yes', 'voice_hoarse.yes'],
  // 蚀于前阴（狐）：症状123 + 前阴溃烂
  ['sleepy.yes', 'eyes_cannot_close.yes', 'low_appetite.yes', 'genital_ulcer.yes'],
  // 蚀于后阴（肛）：症状123 + 肛门溃烂
  ['sleepy.yes', 'eyes_cannot_close.yes', 'low_appetite.yes', 'anal_ulcer.yes'],
  ['face_color_fluctuating.yes', 'eyes_cannot_close.yes']
]

// ---------- 决定 2：赤小豆当归散按「脓已成」原理补路径 ----------
const CHIXIAODOU_NEEDS = [
  // 目四眦黑 + 汗出
  ['eyes_dark_rims.yes', 'sweat.yes'],
  // 目赤如鸠眼 → 目四眦黑
  ['eyes_dark_rims.yes', 'mu_chi.yes'],
  // 脉数而「无热」+ 微烦：热郁在里、化脓的典型象（脉象不做，用「不发热 + 微烦」承接）
  ['eyes_dark_rims.yes', 'restless.yes', 'fever.no']
]

// ---------- 决定 4：删除死节点 + 拆掉依赖它们的空病机路径 ----------
// 这 4 个证候 needs 全空，永远判不出 yes；其中 3 个还被方剂当条件引用，
// 等于把那些方剂的路径全部焊死。按「不留空病机中间层」的口径：
//   · 删掉 4 个节点
//   · 方剂里引用的那条改为直接挂症状（柴胡郁金、厚朴），或直接删掉（乌梅丸有 338 条真路径）
const DEAD = ['ganqi_bushu', 'piyangbuzheng', 'shangjiaoshire', 'shenjingbuzu']
const DEPENDENT_FIX = [
  {
    file: 'chaihu_yujing',
    title: '柴胡 郁金 龙胆草',
    needs: [['hypochondriac_fullness.yes', 'bitter_taste.yes']],
    note: '原先是 needs:["ganqi_bushu.yes"]，而肝气不疏是空节点 → 路径永远不成立。改为直接挂症状：胸胁胀满 + 口苦（疏肝清热的典型靶点）。'
  },
  {
    file: 'houpu',
    title: '厚朴',
    needs: [['abdominal_fullness.yes']],
    note: '原先是 needs:["piyangbuzheng.yes"]，脾阳不振是空节点 → 路径永远不成立。厚朴长于行气除满，改为直接挂腹满。'
  }
]
// 乌梅丸只需要把空病机那条路径去掉，338 条的吐蚘/时烦、久利、气上冲心都还在
const WUMEI_DROP = 'shangjiaoshire.yes'

// ---------- 校验 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
for (const s of NEW_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const c of HUHUO_NEEDS.concat(CHIXIAODOU_NEEDS)) for (const x of c) {
  const dep = String(x).split('.')[0]
  if (!registry[dep] && !NEW_SYMPTOMS.some(s => s.name === dep)) errors.push('引用不存在的节点 ' + dep)
}
if (!registry.hu_huo_bing) errors.push('找不到 hu_huo_bing')
if (!registry.chixiaodou_dangui_san) errors.push('找不到 chixiaodou_dangui_san')
for (const d of DEAD) {
  if (!registry[d]) errors.push('要删的节点不存在：' + d)
  else if (registry[d].kind !== 'summary') errors.push(d + ' 不是证候，不删')
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

// 检查被删节点有没有被别处引用（只允许来自 DEPENDENT_FIX / WUMEI_DROP 已处理的那几处）
const refs = []
const handled = ['chaihu_yujing', 'houpu', 'wumei_wan']
for (const [id, def] of Object.entries(registry)) {
  if (DEAD.includes(id) || handled.includes(id)) continue
  const paths = def.needs ? (Array.isArray(def.needs[0]) ? def.needs : [def.needs]) : []
  for (const p of paths) for (const c of (p || [])) {
    if (DEAD.includes(String(c).split('.')[0])) refs.push(id + ' → ' + c)
  }
}
if (refs.length) { console.log('⚠ 要删的节点仍被引用：\n  ' + refs.join('\n  ')); process.exit(1) }
for (const d of DEPENDENT_FIX) {
  for (const p of d.needs) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) { console.log('⚠ ' + d.file + ' 引用了不存在的节点 ' + dep); process.exit(1) }
  }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

// 重写某节点的 needs（保留 title/kind/comment/contraindications）
function rewriteNeeds(file, needsArr, extraContra) {
  const p = path.join(PLUGINS, 'syndromes', file + '.js')
  const alt = path.join(PLUGINS, 'formulas', file + '.js')
  const target = fs.existsSync(p) ? p : alt
  let src = fs.readFileSync(target, 'utf8')
  const model = registry[file]
  const model2 = {
    name: model.name,
    title: model.title,
    kind: model.kind,
    comment: /\/\/\s*(.+)/.exec(src) ? /\/\/\s*(.+)/.exec(src)[1] : model.title,
    needs: needsArr,
    contraindications: (model.contraindications || []).concat(extraContra || [])
  }
  fs.writeFileSync(target, render(model2), 'utf8')
  return target
}

if (WRITE) {
  console.log('=== 决定 3：新建面色族节点 ===')
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ ' + s.name + '（' + s.title + '）')
  }

  console.log('\n=== 决定 1：狐惑病拆开前后阴路径 ===')
  rewriteNeeds('hu_huo_bing', HUHUO_NEEDS, [
    '蚀于前阴叫「狐」，蚀于肛门叫「蜮/惑」—— 前后阴只要有一处溃烂，配上前面那几个症状就成立，不需要两处都烂'
  ])
  HUHUO_NEEDS.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))

  console.log('\n=== 决定 2：赤小豆当归散补「脓已成」路径 ===')
  rewriteNeeds('chixiaodou_dangui_san', CHIXIAODOU_NEEDS, [
    '判断脓成没成看两点：脉搏快却不发热（热都聚到一处去化脓了），人有点烦、老想躺着，还出汗',
    '眼睛的变化是标志：先红得像鸽子眼，七八天后眼眶四周发黑——见到发黑就是脓已经熟了'
  ])
  CHIXIAODOU_NEEDS.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))

  console.log('\n=== 决定 3：阴毒改用 face_blue 面色发青 ===')
  rewriteNeeds('yin_du', [['face_blue.yes', 'body_pain.yes', 'throat_pain.yes']], [
    '阴毒的面色是「青」——发青发暗，和阳毒的「面赤斑斑如锦纹」正好相反'
  ])
  console.log('  阴毒: face_blue.yes + body_pain.yes + throat_pain.yes')

  console.log('\n=== 决定 4：删除死证候节点 ===')
  const PROV_JSON = path.join(PLUGINS, 'provenance.json')
  const prov = JSON.parse(fs.readFileSync(PROV_JSON, 'utf8'))
  const LAYOUT = path.join(PLUGINS, '.layout.json')
  const layout = JSON.parse(fs.readFileSync(LAYOUT, 'utf8'))
  const box = layout.nodes || layout
  for (const d of DEAD) {
    const f = path.join(PLUGINS, 'syndromes', d + '.js')
    if (fs.existsSync(f)) fs.unlinkSync(f)
    if (prov.nodes && prov.nodes[d]) delete prov.nodes[d]
    if (box[d]) delete box[d]
    console.log('  － 删除 ' + d + '（' + registry[d].title + '）')
  }

  console.log('\n=== 决定 4 连带：把依赖空病机节点的方剂改直挂症状 ===')
  for (const d of DEPENDENT_FIX) {
    const f = path.join(PLUGINS, 'formulas', d.file + '.js')
    const src = fs.readFileSync(f, 'utf8')
    const m = {
      name: d.file,
      title: d.title,
      kind: 'formula',
      comment: d.note,
      needs: d.needs,
      contraindications: (registry[d.file].contraindications || []).slice()
    }
    fs.writeFileSync(f, render(m), 'utf8')
    console.log('  ~ ' + d.file + '（' + d.title + '）→ ' + JSON.stringify(d.needs))
  }

  // 乌梅丸：去掉空病机那条路径，其余保留
  const wf = path.join(PLUGINS, 'formulas', 'wumei_wan.js')
  let wsrc = fs.readFileSync(wf, 'utf8')
  if (wsrc.includes(WUMEI_DROP)) {
    wsrc = wsrc.replace(/\n\s*\['shangjiaoshire\.yes'\],?/, '')
    fs.writeFileSync(wf, wsrc, 'utf8')
    console.log('  ~ wumei_wan（乌梅丸）删掉 [' + WUMEI_DROP + '] 这条空路径，保留 338 条三条真路径')
  }

  for (const s of NEW_SYMPTOMS) {
    prov.nodes[s.name] = { source: 'manual', label: '面色辨证（青赤黄白黑）', refs: [s.comment], by: 'system:batch5-fix' }
  }
  prov.nodes['yin_du'] = { source: 'jinkui', label: '金匮要略原文', refs: [CH3 + ' · 阴毒之为病，面目青，身痛如被杖，咽喉痛'], by: 'system:jinkui' }
  fs.writeFileSync(PROV_JSON, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2) + '\n', 'utf8')

  console.log('\n完成：+4 面色节点、狐惑病 5 条路径、赤小豆 3 条路径、阴毒改 face_blue、删 4 死节点')
} else {
  console.log('=== 新建面色节点 ===')
  for (const s of NEW_SYMPTOMS) console.log('  ' + s.name.padEnd(12) + s.title.padEnd(8) + '｜' + s.ask)
  console.log('\n=== 狐惑病新路径 ===')
  HUHUO_NEEDS.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  console.log('\n=== 赤小豆当归散新路径 ===')
  CHIXIAODOU_NEEDS.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  console.log('\n=== 删除 ===')
  for (const d of DEAD) console.log('  － ' + d + '（' + registry[d].title + '）')
  console.log('\n（预览，加 --write 落库）')
}
