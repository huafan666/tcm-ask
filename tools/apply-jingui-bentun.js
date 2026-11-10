'use strict'
// tools/apply-jingui-bentun.js
// 金匮批 10：第八篇 奔豚气病脉证并治（8.1 ~ 8.4）
//
// 本篇几乎都已在库中：ben_tun 奔豚（症状）、guizhi_jiagui_tang 桂枝加桂汤、
// fuling_guizhi_gancao_zao_tang 茯苓桂枝甘草大枣汤、below_palp 脐下悸。
// 只缺 8.2 的奔豚汤，外加给 ben_tun 补口语说法。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH8 = '金匮要略·奔豚气病脉证并治第八'

const F = {
  name: 'bentun_tang',
  title: '奔豚汤',
  kind: 'formula',
  comment: CH8 + '：奔豚气上冲胸，腹痛，往来寒热，奔豚汤主之。',
  // 三要素全上：气上冲胸 + 腹痛 + 往来寒热 —— 这是原文给的全部条件
  needs: [
    ['ben_tun.yes', 'abdominal_pain.yes', 'alternating_cold_heat.yes'],
    ['ben_tun.yes', 'abdominal_pain.yes']
  ],
  contraindications: [
    '治奔豚偏「肝郁化热」的类型：气从下腹冲到胸口，同时肚子痛、一阵冷一阵热',
    '和桂枝加桂汤的区别：桂枝加桂汤是心阳虚、被外寒引发（多因烧针、针处被寒），偏寒；' +
    '奔豚汤有往来寒热和腹痛，偏肝气郁而化热',
    '方中甘李根白皮是治奔豚的专药（李树根皮，苦咸寒，降逆下气），配葛根、黄芩清热，' +
    '当归、川芎、芍药养血柔肝，半夏、生姜降逆',
    '原文服法是「日三夜一服」——白天三次、夜里一次，因为奔豚常在夜间发作'
  ],
  ref: CH8 + ' · 奔豚气上冲胸，腹痛，往来寒热，奔豚汤主之 · 奔豚汤方（甘草、芎藭、当归、半夏、黄芩、生葛、芍药、生姜、甘李根白皮）'
}

// 8.1 的奔豚定义补进口语触发词
const BEN_TUN_ADD = [
  '气从少腹上冲咽喉', '气从下腹冲到嗓子', '一股气从肚子往上冲到喉咙',
  '发作时难受得要死', '发作欲死', '一阵气往上顶完又好了'
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
if (registry[F.name]) errors.push(F.name + ' 已存在')
for (const p of F.needs) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) errors.push('引用不存在的节点 ' + dep)
}
if (!registry.ben_tun) errors.push('找不到 ben_tun')
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  fs.writeFileSync(path.join(PLUGINS, 'formulas', F.name + '.js'), render(F), 'utf8')
  console.log('  ＋ 方剂 ' + F.name + '（' + F.title + '）')

  // 给 ben_tun 补口语说法
  const bp = path.join(PLUGINS, 'symptoms', 'ben_tun.js')
  let src = fs.readFileSync(bp, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = BEN_TUN_ADD.filter(k => !existing.includes(k))
  if (fresh.length) {
    src = src.replace(m[0], '[' + existing.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
    fs.writeFileSync(bp, src, 'utf8')
    console.log('  ＋ ben_tun 补触发词 ' + fresh.join('、'))
  }

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  prov.nodes[F.name] = { source: 'jinkui', label: '金匮要略原文', refs: [F.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n完成：1 方剂 + ben_tun 补词')
} else {
  console.log(F.title + ' needs=' + JSON.stringify(F.needs))
  console.log('ben_tun 补词：' + BEN_TUN_ADD.join('、'))
  console.log('（预览，加 --write 落库）')
}
