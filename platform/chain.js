'use strict'
// platform/chain.js
// ============================================================
// 辨证「触发链条」：把引擎最终为什么得出这个结论摊开给病人看，并附上每个节点的出处与录入人。
//
//   targets: 成立的方剂/证候 → 命中的那条三元组 → 每个条件当时是 yes/no/unknown
//   每个节点都带 provenance（出自哪本书哪一条 + 谁录入）与 attributions（谁改过哪个字段）
// ============================================================

const provenance = require('../dev/lib/provenance')
const review = require('./review')

function condView(engine, registry, cond) {
  const [name, pol] = engine.splitRef(cond)
  const v = engine.evalCond(cond)
  const def = registry[name]
  return {
    name,
    pol: pol || 'yes',
    title: def ? def.title : name,
    kind: def ? def.kind : '',
    state: v === true ? 'yes' : (v === false ? 'no' : 'unknown'),
    satisfied: v === true
  }
}

/**
 * @param {Engine} engine   已收敛的引擎
 * @param {Object} registry 插件表
 * @returns {{ targets: Array, nodes: Object }}
 */
function buildChain(engine, registry) {
  const state = engine.state || {}
  const yesNames = Object.keys(state).filter(n => state[n] === 'yes' && registry[n])
  const targets = []

  for (const name of yesNames) {
    const def = registry[name]
    // 只对「有条件」的节点（方剂/证候）展开；叶子症状没有路径
    if (!def.needs || !def.needs.length) continue
    if (def.kind !== 'formula' && def.kind !== 'summary') continue

    const paths = engine.normalizeNeeds(def.needs)
    let hit = -1
    const views = paths.map((path, i) => {
      const conds = path.map(c => condView(engine, registry, c))
      const ok = conds.length > 0 && conds.every(c => c.satisfied)
      if (ok && hit < 0) hit = i
      return { pathIndex: i, ok, conditions: conds }
    })
    if (hit < 0) continue      // 成立但不是靠 needs（例如叶子被直接喂入）

    targets.push({
      name,
      title: def.title,
      kind: def.kind,
      pathIndex: hit,
      pathTotal: paths.length,
      path: views[hit].conditions
    })
  }

  // 给病人看：方剂在前，证候在后；太多就只留最相关的 8 条
  targets.sort((a, b) => {
    const wa = a.kind === 'formula' ? 0 : 1
    const wb = b.kind === 'formula' ? 0 : 1
    if (wa !== wb) return wa - wb
    return a.path.length - b.path.length      // 条件少的更"硬"，排前面
  })
  const shown = targets.slice(0, 8)

  // 收集链条上出现过的所有节点，统一附出处与贡献者（一次读完 provenance 文件）
  const provView = provenance.load()
  const names = new Set()
  for (const t of shown) {
    names.add(t.name)
    for (const c of t.path) names.add(c.name)
  }
  const nodes = {}
  for (const n of names) {
    const p = provView.nodes[n] || null
    let contributors = []
    try { contributors = review.attributionOf(n) } catch (_) { contributors = [] }
    nodes[n] = {
      name: n,
      title: registry[n] ? registry[n].title : n,
      state: state[n] || 'unknown',
      provenance: p
        ? {
            sourceId: p.sourceId,
            label: p.label,
            title: p.title,
            author: p.author,
            refs: p.refs,
            by: p.by
          }
        : null,
      contributors: contributors.map(c => ({
        field: c.field,
        fieldLabel: c.fieldLabel,
        displayName: c.author.displayName,
        verified: !!c.author.verified,
        role: c.author.role,
        at: c.at
      }))
    }
  }

  return { targets: shown, nodes, totalTargets: targets.length }
}

module.exports = { buildChain }
