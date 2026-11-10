'use strict'
// tools/inspect-node.js <id> —— 打印某节点的 needs / title
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const id = process.argv[2]
if (!id) { console.log('用法: node tools/inspect-node.js <id>'); process.exit(1) }
const d = registry[id]
if (!d) { console.log('❌ 没有节点 ' + id); process.exit(1) }
console.log(d.kind + '  ' + d.title + '  (' + d.name + ')')
console.log('needs = ' + JSON.stringify(d.needs, null, 1))
console.log('needs[0] 类型 = ' + (Array.isArray(d.needs) ? (Array.isArray(d.needs[0]) ? '数组 ✓' : '⚠ 不是数组：' + typeof d.needs[0]) : '⚠ needs 本身不是数组'))
console.log('contraindications = ' + JSON.stringify(d.contraindications || []))
