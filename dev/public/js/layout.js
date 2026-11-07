// dev/public/js/layout.js
// 分层自动布局：症状/脉象（第 0 层）→ 证候 → 方剂
// 逻辑：depth = 从叶子出发的最长路径；同层内按「依赖者的平均 y」做重心排序减少交叉

// 卡片高度：中文标题 / 英文 name / 徽标行 三行必须各有独立行距，不能相互压住
// 58 时徽标行(y=h-20=38)会压到 name(基线 42) 上，所以放到 70
export const NODE_H = 70
export const COL_GAP = 190
export const ROW_GAP = 18

export function nodeWidth(node) {
  const t = node.title || node.name || ''
  // 中文按 15px 宽度估；name 用等宽 11px 估
  const w = Math.max(24 + t.length * 15, 40 + (node.name || '').length * 7.2, 130)
  return Math.min(260, Math.round(w))
}

export function nodeSize(node) {
  return { w: nodeWidth(node), h: NODE_H }
}

/** 计算每个节点的层号（0 = 最底层输入） */
export function computeDepths(nodes) {
  const byName = new Map(nodes.map(n => [n.name, n]))
  const depth = new Map()
  const visiting = new Set()

  function d(name) {
    if (depth.has(name)) return depth.get(name)
    const n = byName.get(name)
    if (!n) return 0
    if (visiting.has(name)) return 0          // 循环保护
    visiting.add(name)
    let best = 0
    for (const p of n.needs || []) {
      for (const c of p) {
        const dep = byName.get(c.ref)
        if (!dep) continue
        best = Math.max(best, d(c.ref) + 1)
      }
    }
    visiting.delete(name)
    depth.set(name, best)
    return best
  }
  for (const n of nodes) d(n.name)
  return depth
}

/**
 * 生成布局。existing 里有位置的节点会被保留（除非 force）。
 * 返回 { nodes: {name:{x,y}}, width, height }
 */
export function autoLayout(nodes, existing, opts) {
  const o = opts || {}
  const force = !!o.force
  const keep = existing || {}
  const depths = computeDepths(nodes)
  const maxDepth = Math.max(0, ...[...depths.values()])

  // 按层分组
  const cols = Array.from({ length: maxDepth + 1 }, () => [])
  for (const n of nodes) cols[depths.get(n.name) || 0].push(n)

  // 层内初始顺序：按标题，稳定
  cols.forEach(c => c.sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh')))

  // 重心排序两轮：按「依赖的节点」的 y 平均值
  const yOf = new Map()
  cols.forEach(c => c.forEach((n, i) => yOf.set(n.name, i)))

  for (let pass = 0; pass < 3; pass++) {
    for (let ci = 1; ci < cols.length; ci++) {
      const bary = new Map()
      for (const n of cols[ci]) {
        const refs = []
        for (const p of n.needs || []) for (const c of p) if (yOf.has(c.ref)) refs.push(yOf.get(c.ref))
        bary.set(n.name, refs.length ? refs.reduce((a, b) => a + b, 0) / refs.length : 1e6)
      }
      cols[ci].sort((a, b) => (bary.get(a.name) - bary.get(b.name)) || String(a.title).localeCompare(String(b.title), 'zh'))
      cols[ci].forEach((n, i) => yOf.set(n.name, i))
    }
  }

  // 落坐标
  const out = {}
  let maxX = 0
  let maxY = 0
  cols.forEach((col, ci) => {
    let x = 80
    for (let k = 0; k < ci; k++) {
      const wMax = Math.max(...cols[k].map(nodeWidth), 130)
      x += wMax + COL_GAP
    }
    let y = 90
    for (const n of col) {
      if (!force && keep[n.name]) {
        out[n.name] = { x: keep[n.name].x, y: keep[n.name].y }
        y += (keep[n.name].h || NODE_H) + ROW_GAP
      } else {
        out[n.name] = { x, y }
        y += NODE_H + ROW_GAP
      }
      maxX = Math.max(maxX, out[n.name].x + nodeWidth(n))
      maxY = Math.max(maxY, out[n.name].y + NODE_H)
    }
  })

  return { nodes: out, width: maxX + 200, height: maxY + 200 }
}

/** 以某个节点为中心，取 N 跳内的节点集合（含上下游） */
export function neighborhood(startNames, nodes, depth) {
  const byName = new Map(nodes.map(n => [n.name, n]))
  const depsOf = new Map()     // name -> [它依赖的]
  const usersOf = new Map()    // name -> [依赖它的]
  for (const n of nodes) {
    const d = []
    for (const p of n.needs || []) for (const c of p) d.push(c.ref)
    depsOf.set(n.name, d)
    for (const r of d) {
      if (!usersOf.has(r)) usersOf.set(r, [])
      usersOf.get(r).push(n.name)
    }
  }
  const vis = new Set()
  let frontier = [...startNames]
  frontier.forEach(x => vis.add(x))
  for (let step = 0; step < depth; step++) {
    const next = []
    for (const x of frontier) {
      for (const y of (depsOf.get(x) || [])) if (!vis.has(y)) { vis.add(y); next.push(y) }
      for (const y of (usersOf.get(x) || [])) if (!vis.has(y)) { vis.add(y); next.push(y) }
    }
    if (!next.length) break
    frontier = next
  }
  // 只保留存在的
  return new Set([...vis].filter(n => byName.has(n)))
}
