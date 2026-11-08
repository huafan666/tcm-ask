'use strict'
// tools/test-provenance.js
// 用临时文件测 provenance 的写/迁/读，不碰真实数据
const fs = require('fs')
const os = require('os')
const path = require('path')
const prov = require('../dev/lib/provenance')

const tmp = path.join(os.tmpdir(), 'tcm-prov-test-' + Date.now() + '.json')
fs.writeFileSync(tmp, JSON.stringify({ version: 1, sources: {}, nodes: {}, edges: {} }), 'utf8')

let pass = 0, fail = 0
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✓ ' + n) } else { fail++; console.log('  ✗ ' + n + (extra ? ' → ' + JSON.stringify(extra) : '')) } }

// 备注写入
prov.setNote('alpha', '第一版备注', '张明远', tmp)
let raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('备注写进文件', raw.nodes.alpha && raw.nodes.alpha.note === '第一版备注', raw.nodes.alpha)
ok('备注带作者与日期', raw.nodes.alpha.noteBy === '张明远' && !!raw.nodes.alpha.noteAt, raw.nodes.alpha)

// 覆盖备注
prov.setNote('alpha', '第二版备注', '李静', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('备注可覆盖', raw.nodes.alpha.note === '第二版备注' && raw.nodes.alpha.noteBy === '李静', raw.nodes.alpha)

// 清空备注
prov.setNote('alpha', '', '李静', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('备注可清空', !raw.nodes.alpha.note, raw.nodes.alpha)

// 关系备注
prov.setEdgeNote('beta', 'alpha', 'yes', '这条链别人也见过', '张明远', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('关系备注写入', !!(raw.edges['beta|alpha.yes'] && raw.edges['beta|alpha.yes'].note), Object.keys(raw.edges))

// 改名迁移：节点键 + edges 两端
prov.setNote('old_name', '旧名字上的备注', '张明远', tmp)
prov.renameNodeInProvenance('old_name', 'new_name', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('改名后备注跟着走', !!(raw.nodes.new_name && raw.nodes.new_name.note === '旧名字上的备注'), raw.nodes.new_name)
ok('旧名字的键被清掉', !raw.nodes.old_name)

prov.setEdgeNote('x', 'old_name', 'no', '引用了旧名字', '张明远', tmp)
prov.renameNodeInProvenance('old_name', 'new_name', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
const keys = Object.keys(raw.edges)
ok('关系里的引用名也改了（ref 端）', keys.includes('x|new_name.no') && !keys.includes('x|old_name.no'), keys)

prov.setEdgeNote('old_name', 'y', 'yes', 'owner 是旧名字', '张明远', tmp)
prov.renameNodeInProvenance('old_name', 'new_name', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('关系里的 owner 也改了', Object.keys(raw.edges).includes('new_name|y.yes'), Object.keys(raw.edges))

// load() 的展开视图要带 noteBy/noteAt（用真实文件里的已知节点验证）
prov.setNote('gamma', '读回检查', '张牛', tmp)
raw = JSON.parse(fs.readFileSync(tmp, 'utf8'))
ok('临时文件里带 noteBy/noteAt', !!(raw.nodes.gamma.noteBy === '张牛' && raw.nodes.gamma.noteAt), raw.nodes.gamma)
const view = prov.load()
const anyWithBoth = Object.entries(view.nodes).find(([, x]) => x && x.note && x.noteBy)
ok('load() 展开视图透传 noteBy/noteAt', !!anyWithBoth, anyWithBoth && anyWithBoth[1])

fs.unlinkSync(tmp)
console.log('\n============================================')
console.log(`结果: ${pass} 通过, ${fail} 失败`)
if (fail) process.exitCode = 1
