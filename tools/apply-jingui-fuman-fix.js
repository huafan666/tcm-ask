'use strict'
// tools/apply-jingui-fuman-fix.js —— 批 12 修订
//
// 「雷鸣切痛」的「切痛」= 绞痛，库里已有独立节点 duzijiaotonghuocitong（肚子绞痛或刺痛），
// 附子粳米汤原先只挂了 severe_abdominal_pain，导致「绞痛」的说法命不中。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const ID = 'fuzi_jingmi_tang'
const NEEDS = [
  // 腹中雷鸣 + 绞痛 + 呕吐 —— 原文三要素（切痛＝绞痛）
  ['borborygmus.yes', 'duzijiaotonghuocitong.yes', 'vomiting.yes'],
  ['borborygmus.yes', 'severe_abdominal_pain.yes', 'vomiting.yes'],
  ['borborygmus.yes', 'vomiting.yes', 'cold_aversion.yes'],
  ['borborygmus.yes', 'duzijiaotonghuocitong.yes', 'cold_aversion.yes']
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

if (!registry[ID]) { console.log('❌ 找不到 ' + ID); process.exit(1) }
for (const p of NEEDS) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

const f = path.join(PLUGINS, 'formulas', ID + '.js')
const src = fs.readFileSync(f, 'utf8')
const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
const def = registry[ID]

const model = {
  name: ID, title: def.title, kind: 'formula',
  comment,
  needs: NEEDS,
  contraindications: (def.contraindications || []).concat([
    '「雷鸣切痛」的切痛指绞痛，与「肚子绞痛或刺痛」是同一类表现'
  ])
}

if (WRITE) {
  fs.writeFileSync(f, render(model), 'utf8')
  console.log('  ~ ' + ID + ' needs=' + JSON.stringify(NEEDS))
} else {
  console.log(ID + ' = ' + JSON.stringify(NEEDS))
  console.log('（预览，加 --write 落库）')
}
