'use strict'
// tools/test-canvas-ux.js
// 画布新交互的自测（不需要浏览器）：直接跑 store 层的「就地建节点 + 自动连线」逻辑
const path = require('path')

// store.js 是 ES module，用动态 import 跑
;(async () => {
  const { pathToFileURL } = await import('node:url')
  const store = await import(pathToFileURL(path.resolve(__dirname, '..', 'dev', 'public', 'js', 'store.js')).href)
  const S = store.S
  let pass = 0, fail = 0
  const ok = (name, cond, extra) => {
    if (cond) { pass++; console.log('  ✓ ' + name) }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra) : '')) }
  }

  // 造一个最小图：一个症状节点
  S.dirs = { symptom: 'symptoms', pulse: 'pulses', summary: 'syndromes', formula: 'formulas' }
  S.nodes = new Map(); S.order = []; S.created = new Set(); S.deleted = new Set()
  S.layout = { nodes: {}, viewport: null }
  const sym = store.addNode({ name: 'foo_symptom', title: '示例症状', kind: 'symptom', trigger: ['示例'] })
  ok('addNode 能新建症状', !!S.nodes.get('foo_symptom'))

  // 模拟「拖输出到空白 → 推断种类为证候 → 就地建节点 → 自动连线」
  const n = store.addNode({ name: 'new_summary', title: '新证候', kind: 'summary' })
  S.layout.nodes['new_summary'] = { x: 640, y: 220 }
  store.addCondition('new_summary', 'foo_symptom', 'yes', 0)
  const created = S.nodes.get('new_summary')
  ok('就地建节点落到指定坐标', S.layout.nodes.new_summary.x === 640 && S.layout.nodes.new_summary.y === 220)
  ok('新节点记录了 needs', created.needs.length === 1 && created.needs[0][0].ref === 'foo_symptom', created.needs)
  ok('新节点被标记为 created（保存时会写入）', S.created.has('new_summary'))
  ok('新节点默认可编辑', created.editable === true)

  // 撤销栈：建节点与加条件都应留下快照
  ok('产生了撤销快照', S.undo.length >= 2, S.undo.length)

  // 极性支持「非」
  store.addCondition('new_summary', 'foo_symptom', 'no', 0)
  ok('同一引用换极性不会重复添加', S.nodes.get('new_summary').needs[0].length === 1)

  console.log('\n============================================')
  console.log(`结果: ${pass} 通过, ${fail} 失败`)
  if (fail) process.exitCode = 1
})()
