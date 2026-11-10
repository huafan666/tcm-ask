'use strict'
// tools/check-needs-shape.js —— 全库体检 needs 结构 + 悬空引用 + 路径内自相矛盾
//
// 引擎支持两种 needs 写法（engine/engine.js normalizeNeeds）：
//   ['a.yes', 'b.yes']            → 单条 AND 路径
//   [['a.yes','b.yes'], ['c.yes']] → 多条路径，路径内 AND、路径间 OR
// 所以扁平数组是合法的，不能当错误。
//
// 真正要抓的是：
//   1. 条件既不是字符串、也不是数组（写坏了）
//   2. 引用了不存在的节点（悬空引用）
//   3. 空路径 []（会让节点无条件成立）—— 引擎已拒绝写入，这里兜底查
//   4. **同一条路径内**同一节点既 yes 又 no（永远不可能成立）
//      注意：不同路径之间用 yes/no 是合法且常见的鉴别写法，不算错
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const badShape = []
const dangling = []
const emptyPath = []
const selfContradiction = []

for (const [id, def] of Object.entries(registry)) {
  const needs = def.needs
  if (needs === undefined || needs === null) continue          // 叶子节点（症状/脉象）
  if (!Array.isArray(needs)) { badShape.push(id + '  needs 不是数组'); continue }
  if (!needs.length) {
    // 症状/脉象没有推理条件很正常；方剂/证候没有条件就是死节点
    if (def.kind === 'formula' || def.kind === 'summary') badShape.push(id + '  是 ' + def.kind + ' 但没有 needs（死节点）')
    continue
  }

  // 归一化：扁平数组 = 单路径
  const paths = Array.isArray(needs[0]) ? needs : [needs]

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i]
    if (!Array.isArray(p)) { badShape.push(id + '  paths[' + i + '] 不是数组：' + JSON.stringify(p)); continue }
    if (!p.length) { emptyPath.push(id + '  paths[' + i + '] 是空路径（会无条件成立）'); continue }
    const seen = new Map()
    for (const c of p) {
      if (typeof c !== 'string') { badShape.push(id + '  paths[' + i + '] 含非字符串 ' + JSON.stringify(c)); continue }
      const m = /^([A-Za-z0-9_]+)\.(yes|no)$/.exec(c)
      if (!m) { badShape.push(id + '  条件格式不对：' + c); continue }
      const [, node, pol] = m
      if (!registry[node]) dangling.push(id + ' → ' + c)
      if (seen.has(node) && seen.get(node) !== pol) {
        selfContradiction.push(id + '  paths[' + i + '] 同时含 ' + node + '.yes 和 ' + node + '.no')
      }
      seen.set(node, pol)
    }
  }
}

const show = (title, arr) => {
  console.log('\n=== ' + title + '（' + arr.length + '）===')
  for (const x of arr.slice(0, 40)) console.log('  ✗ ' + x)
  if (arr.length > 40) console.log('  …… 还有 ' + (arr.length - 40) + ' 条')
}

show('needs 结构写坏', badShape)
show('空路径', emptyPath)
show('悬空引用（引用了不存在的节点）', dangling)
show('同一条路径内 yes/no 自相矛盾', selfContradiction)

const total = Object.keys(registry).length
const ok = badShape.length + emptyPath.length + dangling.length + selfContradiction.length === 0
console.log('\n共扫描 ' + total + ' 个节点 —— ' + (ok ? '全部正常 ✓' : '存在上述问题'))
process.exit(ok ? 0 : 1)
