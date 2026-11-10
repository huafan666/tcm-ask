'use strict'
// tools/merge-duplicate-formula.js
// 合并「麻黄连翘赤小豆汤」的两个节点：
//   mahuang_liangqiao_chixiaodou_tang（内容完整，但「连」拼音误写成 liangqiao）
//   mahuang_lianqiao_chixiaodou_tang（拼音正确，但 needs 写坏：['skin_yang.yes'] 少了外层数组，
//                                      且 skin_yang 这个节点根本不存在 → 死节点）
// 处理：内容保留完整版，id 统一为 lianqiao；删掉坏节点；迁移 provenance 与画布坐标。
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const OLD = 'mahuang_liangqiao_chixiaodou_tang'
const NEW = 'mahuang_lianqiao_chixiaodou_tang'

const SOURCE = [
  "module.exports = {",
  "  name: '" + NEW + "',",
  "  title: '麻黄连翘赤小豆汤',",
  "  kind: 'formula',",
  "  // 第262条: 伤寒瘀热在里，身必黄，麻黄连轺赤小豆汤主之。",
  "  // 瘀热在里不得外越而发黄。核心=身黄 + 表闭无汗（麻黄开表）。",
  "  // 与茵陈蒿汤区别：茵陈蒿汤有明显小便不利；与栀子檗皮汤区别：后者有发热。",
  "  needs: [",
  "    ['jaundice.yes', 'no_sweat.yes']",
  "  ],",
  "  contraindications: [",
  "    '身黄 + 无汗（瘀热在里、表气闭住，热散不出去所以发黄）',",
  "    '治法清利湿热 + 开表透邪（麻黄、连翘、赤小豆）',",
  "    '如果小便明显不通畅，更适合茵陈蒿汤',",
  "    '如果有明显发热，更适合栀子檗皮汤'",
  "  ]",
  "}",
  ""
].join('\n')

let changed = []
fs.writeFileSync(path.join(PLUGINS, 'formulas', NEW + '.js'), SOURCE, 'utf8')
changed.push('改写 ' + NEW + '.js（内容取自完整版）')

const oldFile = path.join(PLUGINS, 'formulas', OLD + '.js')
if (fs.existsSync(oldFile)) { fs.unlinkSync(oldFile); changed.push('删除坏节点文件 ' + OLD + '.js') }

// provenance
const PROV = path.join(PLUGINS, 'provenance.json')
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
if (prov.nodes[OLD]) { prov.nodes[NEW] = prov.nodes[OLD]; delete prov.nodes[OLD]; changed.push('provenance 迁移 ' + OLD + ' → ' + NEW) }
else if (!prov.nodes[NEW]) changed.push('⚠ provenance 里没有 ' + OLD)
if (prov.edges) {
  let e = 0
  for (const k of Object.keys(prov.edges)) if (k.includes(OLD)) { prov.edges[k.replace(OLD, NEW)] = prov.edges[k]; delete prov.edges[k]; e++ }
  if (e) changed.push('provenance.edges 迁移 ' + e + ' 条')
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')

// 画布坐标：保留内容更靠前的那份（y=3170），删掉 y=7306 那份
const LAYOUT = path.join(PLUGINS, '.layout.json')
const layout = JSON.parse(fs.readFileSync(LAYOUT, 'utf8'))
const box = layout.nodes || layout
if (box[OLD]) { delete box[OLD]; changed.push('画布坐标移除 ' + OLD) }
if (box[NEW]) changed.push('画布坐标保留 ' + NEW + ' @' + JSON.stringify(box[NEW]))
fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2) + '\n', 'utf8')

console.log(changed.map(c => '  · ' + c).join('\n'))
console.log('\n合并完成')
