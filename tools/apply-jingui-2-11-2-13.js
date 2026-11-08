'use strict'
// tools/apply-jingui-2-11-2-13.js
// 落库金匮痉病的三个方证：2.11 栝蒌桂枝汤（新建）/ 2.12 葛根汤（加路径）/ 2.13 大承气汤（加路径）
//
//   node tools/apply-jingui-2-11-2-13.js            # 预览
//   node tools/apply-jingui-2-11-2-13.js --write    # 写盘
//
// 三条原文（金匮要略·痉湿暍病脉证并治第二）：
//   2.11 太阳病，其证备，身体强，几几然，脉反沉迟，此为痉，栝蒌桂枝汤主之。
//   2.12 太阳病，无汗而小便反少，气上冲胸，口噤不得语，欲作刚痉，葛根汤主之。
//   2.13 痉为病，胸满口噤，卧不著席，脚挛急，必齘齿，可与大承气汤。

const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

const CH2 = '金匮要略·痉湿暍病脉证并治第二'

// ---------- 新建：栝蒌桂枝汤（柔痉用方） ----------
const NEW_FORMULA = {
  name: 'gualou_guizhi_tang',
  title: '栝蒌桂枝汤',
  kind: 'formula',
  comment: CH2 + '：太阳病，其证备，身体强，几几然，脉反沉迟，此为痉，栝蒌桂枝汤主之。',
  needs: [
    // 汗出 + 身体强几几 + 不恶寒 = 柔痉（表虚津伤、筋脉失养）
    ['sweat.yes', 'neck_stiff_pain.yes', 'cold_aversion.no']
  ],
  contraindications: [
    '柔痉主方：汗出、身体强几几而脉沉迟（桂枝汤加栝蒌根，解肌生津、舒缓筋脉）',
    '与葛根汤区别在有无汗出：无汗而欲作刚痉者用葛根汤，汗出者用本方',
    '条文本有脉反沉迟，脉象暂不入判定（本项目约定）',
    '取微汗，不可大汗；痉病误汗则表益虚、恶寒更甚'
  ],
  ref: CH2 + ' · 太阳病，其证备，身体强，几几然，脉反沉迟，此为痉，栝蒌桂枝汤主之'
}

// ---------- 追加路径：葛根汤（2.12 欲作刚痉）、大承气汤（2.13 痉病里热成实） ----------
const PATCHES = [
  {
    name: 'gegen_tang',
    addPath: ['no_sweat.yes', 'kou_jin.yes', 'qi_surge.yes'],
    addContra: CH2 + '：太阳病无汗而小便反少，气上冲胸，口噤不得语，欲作刚痉，葛根汤主之',
    why: '无汗 + 口噤不得语 + 气上冲胸 = 欲作刚痉（表实筋急、气逆上冲）'
  },
  {
    name: 'dachengqi_tang',
    addPath: ['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes'],
    addContra: CH2 + '：痉为病，胸满口噤，卧不著席，脚挛急，必齘齿，可与大承气汤',
    why: '口噤 + 胸满 + 脚挛急 + 喜冷饮（里热成实、热极生风）'
  }
]

// ---------- 校验 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
if (registry[NEW_FORMULA.name] && !FORCE) errors.push(`${NEW_FORMULA.name} 已存在（要覆盖加 --force）`)
for (const p of PATCHES) {
  const def = registry[p.name]
  if (!def) { errors.push(`${p.name} 不存在`); continue }
  const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
  const sig = JSON.stringify(p.addPath)
  if (paths.map(x => JSON.stringify(x)).includes(sig)) errors.push(`${p.name} 已有相同路径 ${sig}`)
}
for (const path1 of (NEW_FORMULA.needs || [])) {
  for (const c of path1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(`栝蒌桂枝汤 引用了不存在的节点 ${dep}`)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

// ---------- 写盘 ----------
function render(model) {
  const m = Object.assign({}, model, { needs: model.needs.map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  if (!registry[NEW_FORMULA.name] || FORCE) {
    fs.writeFileSync(path.join(PLUGINS, 'formulas', NEW_FORMULA.name + '.js'), render(NEW_FORMULA), 'utf8')
    console.log('  ＋ 新建 ' + NEW_FORMULA.name + '（' + NEW_FORMULA.title + '）')
  }

  for (const p of PATCHES) {
    const def = registry[p.name]
    const abs = path.join(PLUGINS, def.dir, def.file)
    const before = fs.readFileSync(abs, 'utf8')
    const cur = P.scanPluginSource(before).model
    // cur.needs 已经是 [[{ref, pol}]] 结构，别再套一层 refToCond
    const needs = cur.needs.map(x => x.slice())
    needs.push(p.addPath.map(P.condToRef))
    const contra = (cur.contraindications || []).slice()
    if (!contra.includes(p.addContra)) contra.push(p.addContra)
    const r = P.patchPluginSource(before, { needs, contraindications: contra })
    if (r.changed) {
      fs.writeFileSync(abs, r.text, 'utf8')
      console.log(`  ✎ ${p.name} 加路径 ${JSON.stringify(p.addPath)}`)
    } else {
      console.log(`  · ${p.name} 无需改动`)
    }
    for (const n of r.notes) console.log('    note: ' + n)
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  prov.nodes[NEW_FORMULA.name] = {
    source: 'jinkui', label: '金匮要略原方', refs: [NEW_FORMULA.ref], by: 'system:jinkui'
  }
  // 葛根汤 / 大承气汤 是伤寒论方，多出来的金匮条文记在 provenance 的 note 里，不抢 source
  prov.nodes.gegen_tang = Object.assign({}, prov.nodes.gegen_tang, {
    note: '另见金匮要略·痉湿暍病脉证并治第二：无汗而小便反少、气上冲胸、口噤不得语，欲作刚痉'
  })
  prov.nodes.dachengqi_tang = Object.assign({}, prov.nodes.dachengqi_tang, {
    note: '另见金匮要略·痉湿暍病脉证并治第二：痉病胸满口噤、卧不著席、脚挛急、齘齿'
  })
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：1 个新方剂 + 2 条新路径 + provenance')
} else {
  console.log('=== 新建 ===')
  console.log(render(NEW_FORMULA))
  console.log('=== 追加路径 ===')
  for (const p of PATCHES) console.log('  ' + p.name + '  +' + JSON.stringify(p.addPath) + '   // ' + p.why)
  console.log('\n（预览，未写盘。加 --write 落库）')
}
