'use strict'
// tools/fix-vomit-ambiguity.js
//
// 用户 Q2 定的口径：干呕算「呕」（有呕吐动作、只是没东西出来）；恶心/想吐不算（只是感觉没有动作）。
// 实测发现三处违反：
//   1. vomiting（呕逆）的 trigger 里有「想吐」「欲吐」→ 说「恶心想吐但没吐」也会点亮呕吐
//   2. vomit_any（呕吐组）的 trigger 里有「想吐」→ 同上，组被污染
//   3. vomit_any 的 trigger 里有「吐出来」→「把痰吐出来」会被误判成呕吐
//
// 另外 Q3：咯血（咳出来的血）和吐血是两回事，必须单独立节点。
// 目前库里根本没有「咯血」节点，说「咳出血来」什么都点不亮 —— 这是漏，补上。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

// ① 从 vomiting 里去掉「想吐/欲吐」，并改写问法让它不再同时问两件事
const VOMITING = {
  name: 'vomiting',
  title: '呕逆',
  kind: 'symptom',
  comment: '呕：有呕吐动作就算（含干呕——想吐但吐不出东西）。单纯恶心（只有感觉没有动作）不算，另见 nausea。',
  trigger: ['呕', '呕逆', '干呕', '呕吐', '吐完', '吐后', '吐了', '呕吐过',
    '吐得厉害', '吐个不停', '吐得难受', '吐了一地'],
  negate: ['不呕', '不想吐', '不吐', '没有呕'],
  ask: '是不是真的有过呕吐动作——吐出东西来，或者干呕（想吐但吐不出东西）？'
}

// ② 新节点：恶心（只有感觉，没有呕吐动作）
const NAUSEA = {
  name: 'nausea',
  title: '恶心（想吐但没吐）',
  kind: 'symptom',
  comment: '恶心：只有想吐的感觉，并没有做出呕吐动作（没有吐出东西、也不是干呕）。',
  trigger: ['恶心', '想吐', '欲吐', '泛恶', '作呕', '心里呕得慌', '反胃想吐'],
  negate: ['不恶心', '不想吐'],
  ask: '是不是只是恶心、想吐，但并没有真的吐出来（也不是干呕）？'
}

// ③ 新节点：咯血（从肺/气道咳出来的血）—— 绝不是吐血
const HEMOPTYSIS = {
  name: 'hemoptysis',
  title: '咯血（咳出来的血）',
  kind: 'symptom',
  comment: '咯血：血是从肺或气道随咳嗽出来的，不是从胃里呕出来的。与吐血（呕血）严格分开。',
  trigger: ['咯血', '咳出血', '咳出血来', '咳嗽带血', '痰里带血', '痰中带血', '咳血',
    '咳嗽吐血丝', '咳出血丝'],
  negate: ['没咯血', '不咳血', '痰里没血'],
  ask: '是不是咳嗽的时候咳出血来（血是从嗓子里咳出来的，不是呕出来的）？'
}

// ④ vomit_any 的 trigger 去掉「想吐」「吐出来」
const VOMIT_ANY_TRIGGER = ['呕', '呕吐', '干呕', '反胃', '吐了', '吐得']

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
if (registry.nausea) errors.push('nausea 已存在')
if (registry.hemoptysis) errors.push('hemoptysis 已存在')
if (!registry.vomiting) errors.push('找不到 vomiting')
if (!registry.vomit_any) errors.push('找不到 vomit_any')
for (const c of VOMIT_ANY_TRIGGER) {
  if (/想吐|吐出来/.test(c)) errors.push('vomit_any trigger 仍含易混词: ' + c)
}
if (errors.length) { console.log('❌ ' + errors.join(' / ')); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

// 改 vomiting 的 trigger（保留文件里其它字段与注释）
function patchTrigger(file, add, remove) {
  const p = path.join(PLUGINS, 'symptoms', file + '.js')
  let src = fs.readFileSync(p, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  if (!m) return '⚠ ' + file + ' 找不到关键词数组'
  let list = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const before = list.length
  list = list.filter(k => !remove.includes(k))
  for (const k of add) if (!list.includes(k)) list.push(k)
  src = src.replace(m[0], '[' + list.map(k => "'" + k + "'").join(', ') + '].some')
  fs.writeFileSync(p, src, 'utf8')
  return '  ~ ' + file + ' 触发词 ' + before + ' → ' + list.length
}

if (WRITE) {
  // vomiting
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'vomiting.js'), render(VOMITING), 'utf8')
  console.log('  ~ vomiting 重写（去掉「想吐/欲吐」，问法改为只问呕吐动作）')

  // 新节点
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'nausea.js'), render(NAUSEA), 'utf8')
  console.log('  ＋ 症状 nausea（恶心·想吐但没吐）')
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'hemoptysis.js'), render(HEMOPTYSIS), 'utf8')
  console.log('  ＋ 症状 hemoptysis（咯血·咳出来的血）')

  // vomit_any 的 trigger
  const va = path.join(PLUGINS, 'symptoms', 'vomit_any.js')
  let s = fs.readFileSync(va, 'utf8')
  const mm = /\['([^\]]*)'\]\.some/.exec(s)
  s = s.replace(mm[0], '[' + VOMIT_ANY_TRIGGER.map(k => "'" + k + "'").join(', ') + '].some')
  fs.writeFileSync(va, s, 'utf8')
  console.log('  ~ vomit_any 触发词收紧为 ' + JSON.stringify(VOMIT_ANY_TRIGGER))

  // vomit_on_food 把口语化的「想吃吐」交给 nausea，只保留条文的「欲呕」类说法
  console.log(patchTrigger('vomit_on_food',
    ['食谷欲呕', '欲呕', '得食即呕', '进食则呕'],
    ['吃就想吐', '吃了想吐', '吃不下还想吐']))

  // hemoptysis 要进「出血」族（但绝不进「呕吐」族）
  const bg = path.join(PLUGINS, 'symptoms', 'bleeding_any.js')
  let bs = fs.readFileSync(bg, 'utf8')
  if (!bs.includes("'hemoptysis'")) {
    bs = bs.replace("children: [", "children: ['hemoptysis', ")
    fs.writeFileSync(bg, bs, 'utf8')
    console.log('  ＋ bleeding_any 加入 hemoptysis')
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  prov.nodes.nausea = { source: 'manual', label: '症状细化（恶心与呕吐区分）', refs: ['恶心：只有感觉无呕吐动作'], by: 'system:fix' }
  prov.nodes.hemoptysis = { source: 'manual', label: '症状细化（咯血与吐血区分）', refs: ['咯血：咳嗽出血，非呕血'], by: 'system:fix' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n完成')
} else {
  console.log('将重写 vomiting、新建 nausea/hemoptysis、收紧 vomit_any、补 bleeding_any')
}
