'use strict'
// tools/apply-jingui-shuiqi-fix.js —— 给防己黄芪汤补金匮 14.27 的风水路径
//
// 该节点的 needs 用的是「扁平数组＝单路径」的简写形式：
//   needs: ['body_heavy.yes', 'sweat.yes', 'wind_aversion.yes']
// 所以上一批的 appendPath（只认 [['..'],['..']] 形式）找不到插入点。
// 这里改写成标准的路径数组，并加上风水那条：
//   金匮 14.27：风水，脉浮身重，汗出恶风者 → 身重 + 汗出 + 怕风（原有，属痉湿暍篇风湿）
//   金匮 14.27 风水：水肿 + 怕风 + 汗出（新增）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const F = path.join(PLUGINS, 'formulas', 'fangji_huangqi_tang.js')
const WRITE = process.argv.includes('--write')

const NEEDS = [
  // 痉湿暍篇第 2 条 + 金匮 14.27 共有的「身重、汗出、恶风」
  ['body_heavy.yes', 'sweat.yes', 'wind_aversion.yes'],
  // 金匮 14.27 风水：以水肿为主
  ['pitting_edema.yes', 'wind_aversion.yes', 'sweat.yes']
]

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

const src = fs.readFileSync(F, 'utf8')
const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
const def = registry.fangji_huangqi_tang

const model = {
  name: 'fangji_huangqi_tang',
  title: def.title,
  kind: 'formula',
  comment: comment +
    ' | 金匮 14.27：风水，脉浮身重，汗出恶风者，防己黄芪汤主之。',
  needs: NEEDS,
  contraindications: (def.contraindications || []).concat([
    '金匮 14.27 的风水也用它：以水肿为主时，条件改为「水肿 + 汗出 + 恶风」'
  ])
}

if (WRITE) {
  fs.writeFileSync(F, render(model), 'utf8')
  console.log('  ~ fangji_huangqi_tang 改为 2 条路径')
} else {
  console.log('fangji_huangqi_tang = ' + JSON.stringify(NEEDS))
  console.log('（预览，加 --write 落库）')
}
