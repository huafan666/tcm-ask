'use strict'
// tools/apply-jingui-outu-fix2.js —— 批 18 修订二
//
// 1. 半夏干姜散：库里有更贴切的既有节点 vomit_saliva（干呕吐涎沫），
//    本法用「干呕吐涎沫」最典型，改挂 vomit_saliva 而不是 saliva_spit（吐清水唾沫是肺痿那条）
// 2. severe_thirst 不认「渴得厉害」
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const NEEDS = [
  ['vomit_saliva.yes', 'cold_aversion.yes'],
  ['vomit_saliva.yes', 'cold_extremities.yes'],
  ['vomiting.yes', 'saliva_spit.yes', 'cold_aversion.yes']
]

const THIRST_ADD = ['渴得厉害', '特别渴', '渴得难受', '一直想喝水', '贪喝', '渴得不行']

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
for (const p of NEEDS) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  const f = path.join(PLUGINS, 'formulas', 'banxia_ganjiang_san.js')
  const src = fs.readFileSync(f, 'utf8')
  const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
  const def = registry.banxia_ganjiang_san
  fs.writeFileSync(f, render({
    name: 'banxia_ganjiang_san', title: def.title, kind: 'formula', comment,
    needs: NEEDS,
    contraindications: (def.contraindications || []).concat([
      '「干呕吐涎沫」在库里另有 vomit_saliva 节点，与本方最贴合'
    ])
  }), 'utf8')
  console.log('  ~ banxia_ganjiang_san needs=' + JSON.stringify(NEEDS))

  const tp = path.join(PLUGINS, 'symptoms', 'severe_thirst.js')
  let s = fs.readFileSync(tp, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(s)
  const ex = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = THIRST_ADD.filter(k => !ex.includes(k))
  s = s.replace(m[0], '[' + ex.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
  fs.writeFileSync(tp, s, 'utf8')
  console.log('  ＋ severe_thirst 补 ' + fresh.join('、'))
  console.log('\n完成')
} else {
  console.log(JSON.stringify(NEEDS))
}
