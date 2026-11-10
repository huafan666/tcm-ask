'use strict'
// tools/merge-guizhifulingwan.js
// 合并「桂枝茯苓丸」的两个节点：
//   guizhifulingwan      —— 早期手工节点，只有 needs:['tongjing.yes','duzijiaotonghuocitong.yes']（痛经+绞痛）
//   guizhi_fuling_wan    —— 批 21 按金匮 20.2 建的正规节点（症痼害、漏下）
// 保留命名规范的 guizhi_fuling_wan，把痛经两条路径并进去，删掉旧节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const OLD = 'guizhifulingwan'
const NEW = 'guizhi_fuling_wan'
const WRITE = process.argv.includes('--write')

const NEEDS = [
  // 金匮 20.2：症痼害 —— 瘀血包块导致漏下不止
  ['vaginal_bleeding.yes', 'fixed_mass.yes'],
  ['lou_xia.yes', 'fixed_mass.yes'],
  ['vaginal_bleeding.yes', 'lower_abdomen_cramp.yes'],
  // 旧节点的痛经用法（保留）
  ['tongjing.yes', 'duzijiaotonghuocitong.yes']
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
for (const p of NEEDS) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的 ' + dep); process.exit(1) }
}
if (!registry[NEW] || !registry[OLD]) { console.log('❌ 两个节点必须都在'); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  const def = registry[NEW]
  const src = fs.readFileSync(path.join(PLUGINS, 'formulas', NEW + '.js'), 'utf8')
  const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
  fs.writeFileSync(path.join(PLUGINS, 'formulas', NEW + '.js'), render({
    name: NEW, title: def.title, kind: 'formula', comment,
    needs: NEEDS,
    contraindications: (def.contraindications || []).concat([
      '旧版本还有一条痛经用法（痛经 + 绞痛），已并入本节点'
    ])
  }), 'utf8')
  console.log('  ~ ' + NEW + ' needs=' + JSON.stringify(NEEDS))

  fs.unlinkSync(path.join(PLUGINS, 'formulas', OLD + '.js'))
  console.log('  － 删除旧节点 ' + OLD + '.js')

  const PROV = path.join(PLUGINS, 'provenance.json')
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  if (prov.nodes && prov.nodes[OLD]) { delete prov.nodes[OLD]; console.log('  － provenance 移除 ' + OLD) }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')

  const LAYOUT = path.join(PLUGINS, '.layout.json')
  const layout = JSON.parse(fs.readFileSync(LAYOUT, 'utf8'))
  const box = layout.nodes || layout
  if (box[OLD]) { delete box[OLD]; console.log('  － 画布坐标移除 ' + OLD) }
  fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2) + '\n', 'utf8')
  console.log('\n合并完成')
} else {
  console.log(JSON.stringify(NEEDS))
}
