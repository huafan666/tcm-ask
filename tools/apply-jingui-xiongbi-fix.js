'use strict'
// tools/apply-jingui-xiongbi-fix.js —— 批 11 修订
//
// 实测发现两处漏词：
//   1. 「胸中气塞」(9.6) 是金匮的独立说法，既有 chest_stuffy 只管「胸中窒」，
//      chest_fullness 管「胸满」——语义都不完全等价，建 chest_qi_stuffiness
//   2. heart_pain_radiate 没有「穿透」的说法
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH9 = '金匮要略·胸痹心痛短气病脉证并治第九'

const NEW_SYMPTOM = {
  name: 'chest_qi_stuffiness',
  title: '胸中气塞',
  kind: 'symptom',
  comment: CH9 + '：胸痹，胸中气塞，短气，茯苓杏仁甘草汤主之；橘枳姜汤亦主之。',
  trigger: ['胸中气塞', '胸口发塞', '胸中闷塞', '气塞胸口', '胸口塞得慌', '胸里堵着一股气',
    '胸口像塞了东西'],
  negate: ['胸口不塞'],
  ask: '是不是胸口像塞着一团气、闷得不通气？'
}

// 需要改 needs 的方剂
const FIX = {
  gualou_xiebai_baijiu_tang: [
    ['chest_back_pain.yes', 'short_breath.yes'],
    ['chest_back_pain.yes', 'cough.yes']
  ],
  zhishi_xiebai_guizhi_tang: [
    ['hypochondriac_rush.yes', 'chest_qi_stuffiness.yes'],
    ['hypochondriac_rush.yes', 'hypochondriac_fullness.yes']
  ],
  fuling_xingren_gancao_tang: [
    ['chest_qi_stuffiness.yes', 'short_breath.yes', 'cough.yes'],
    ['chest_qi_stuffiness.yes', 'short_breath.yes']
  ],
  juzhi_jiang_tang: [
    ['chest_qi_stuffiness.yes', 'restless.yes'],
    ['chest_qi_stuffiness.yes', 'belching.yes']
  ]
}

const HEART_RADIATE_ADD = ['心痛得穿透', '穿透到后背', '痛穿到后背', '心痛穿透背部',
  '背痛穿透到心', '前后穿透着疼']

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

if (registry[NEW_SYMPTOM.name]) { console.log('❌ ' + NEW_SYMPTOM.name + ' 已存在'); process.exit(1) }
for (const [k, paths] of Object.entries(FIX)) {
  if (!registry[k]) { console.log('❌ 找不到 ' + k); process.exit(1) }
  for (const p of paths) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && dep !== NEW_SYMPTOM.name) { console.log('❌ ' + k + ' 引用不存在的 ' + dep); process.exit(1) }
  }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

// 读取已有节点的 comment（第一行注释）
function commentOf(id, kind) {
  const dirs = { formula: 'formulas', summary: 'syndromes', symptom: 'symptoms' }
  const f = path.join(PLUGINS, dirs[kind], id + '.js')
  const src = fs.readFileSync(f, 'utf8')
  const m = /^\/\/\s*(.+)$/m.exec(src)
  return m ? m[1] : ''
}

if (WRITE) {
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', NEW_SYMPTOM.name + '.js'), render(NEW_SYMPTOM), 'utf8')
  console.log('  ＋ 症状 ' + NEW_SYMPTOM.name + '（' + NEW_SYMPTOM.title + '）')

  for (const [id, paths] of Object.entries(FIX)) {
    const def = registry[id]
    const model = {
      name: id, title: def.title, kind: 'formula',
      comment: commentOf(id, 'formula'),
      needs: paths,
      contraindications: (def.contraindications || []).slice()
    }
    fs.writeFileSync(path.join(PLUGINS, 'formulas', id + '.js'), render(model), 'utf8')
    console.log('  ~ ' + id + ' needs=' + JSON.stringify(paths))
  }

  // heart_pain_radiate 补词
  const hp = path.join(PLUGINS, 'symptoms', 'heart_pain_radiate.js')
  let src = fs.readFileSync(hp, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = HEART_RADIATE_ADD.filter(k => !existing.includes(k))
  if (fresh.length) {
    src = src.replace(m[0], '[' + existing.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
    fs.writeFileSync(hp, src, 'utf8')
    console.log('  ＋ heart_pain_radiate 补触发词 ' + fresh.join('、'))
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  prov.nodes[NEW_SYMPTOM.name] = { source: 'jinkui', label: '金匮要略原文', refs: [NEW_SYMPTOM.comment], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n完成')
} else {
  console.log('新增 ' + NEW_SYMPTOM.name)
  for (const [k, v] of Object.entries(FIX)) console.log('  ' + k + ' = ' + JSON.stringify(v))
  console.log('（预览，加 --write 落库）')
}
