// dev/public/js/store.js
// 开发端前端状态中心：工作模型、改动追踪、撤销栈、保存载荷组装
//
// 重要设计：
//   节点以「改名后的新 name」为键；被改名的节点保留 renamedFrom。
//   needs 的改名改写由服务端负责（只替换字符串字面量，保留注释），
//   所以前端在改名时同步更新自己的显示模型，但把结果记进 needsBaseline，
//   提交载荷时用 needsBaseline 作为比较基准 —— 这样「只因改名产生的引用变化」
//   不会被当成用户改动而触发整段 needs 重写。

export const S = {
  nodes: new Map(),
  order: [],
  created: new Set(),
  deleted: new Set(),
  layout: { nodes: {}, viewport: null },
  stats: null,
  dirs: {},
  naturalKind: {},
  sel: new Set(),
  selEdge: null,
  sim: null,
  simInput: {},
  walk: null,
  chain: null,
  focus: false,
  focusDepth: 2,
  showEdges: true,
  showArrows: true,
  simColor: true,
  onlyIssues: false,
  kindFilter: new Set(),
  flagFilter: new Set(),
  search: '',
  view: { x: 60, y: 60, k: 1 },
  layoutDirty: false,
  undo: [],
  redo: []
}

const listeners = {}
export function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn) }
export function emit(evt, data) { (listeners[evt] || []).forEach(f => { try { f(data) } catch (e) { console.error(e) } }) }

// ------------------------------------------------------------
// 载入 / 快照 / 撤销
// ------------------------------------------------------------

function clone(x) { return JSON.parse(JSON.stringify(x)) }

export function loadGraph(data) {
  S.nodes = new Map()
  S.order = []
  S.created = new Set()
  S.deleted = new Set()
  S.sel = new Set()
  S.selEdge = null
  S.sim = null
  S.simInput = {}
  S.walk = null
  S.chain = null
  S.undo = []
  S.redo = []
  S.stats = data.stats
  S.dirs = data.dirs
  S.naturalKind = data.naturalKind
  S.layout = data.layout && data.layout.nodes ? data.layout : { nodes: {}, viewport: null }

  for (const n of data.nodes) {
    const node = {
      name: n.name,
      title: n.title,
      kind: n.kind,
      dir: n.dir,
      file: n.file,
      isLeaf: n.isLeaf,
      editable: n.editable,
      readOnlyReason: n.readOnlyReason,
      fileHash: n.fileHash,
      trigger: clone(n.trigger || []),
      negate: clone(n.negate || []),
      ask: n.ask || '',
      needs: clone(n.needs || []),
      contraindications: clone(n.contraindications || []),
      modes: n.modes,
      renamedFrom: null,
      needsBaseline: null,
      created: false,
      orig: {
        name: n.name, title: n.title, kind: n.kind,
        trigger: clone(n.trigger || []), negate: clone(n.negate || []),
        ask: n.ask || '', needs: clone(n.needs || []),
        contraindications: clone(n.contraindications || [])
      }
    }
    S.nodes.set(node.name, node)
    S.order.push(node.name)
  }
  // 有保存过布局的位置就用它，否则标记需要自动布局
  emit('graph-loaded')
  recomputeDirty()
}

/** 记录一次可撤销的快照（在改动**之前**调用） */
export function snap() {
  S.undo.push(JSON.stringify({
    nodes: [...S.nodes.entries()].map(([k, v]) => [k, v]),
    order: S.order, created: [...S.created], deleted: [...S.deleted],
    layout: S.layout
  }))
  if (S.undo.length > 120) S.undo.shift()
  S.redo = []
}

function restore(str) {
  const d = JSON.parse(str)
  S.nodes = new Map(d.nodes)
  S.order = d.order
  S.created = new Set(d.created)
  S.deleted = new Set(d.deleted)
  S.layout = d.layout
  S.sel = new Set([...S.sel].filter(n => S.nodes.has(n)))
  S.selEdge = null
  recomputeDirty()
  emit('model-changed')
}

export function undo() {
  if (!S.undo.length) return false
  S.redo.push(JSON.stringify({ nodes: [...S.nodes.entries()].map(([k, v]) => [k, v]), order: S.order, created: [...S.created], deleted: [...S.deleted], layout: S.layout }))
  restore(S.undo.pop())
  return true
}

export function redo() {
  if (!S.redo.length) return false
  S.undo.push(JSON.stringify({ nodes: [...S.nodes.entries()].map(([k, v]) => [k, v]), order: S.order, created: [...S.created], deleted: [...S.deleted], layout: S.layout }))
  restore(S.redo.pop())
  return true
}

// ------------------------------------------------------------
// 查询辅助
// ------------------------------------------------------------

export function node(name) { return S.nodes.get(name) }
export function allNodes() { return S.order.map(n => S.nodes.get(n)).filter(Boolean) }
export function isDirty(name) {
  const n = S.nodes.get(name)
  if (!n) return false
  if (n.created) return true
  return diffOf(n) !== null || !!n.renamedFrom
}

/** 返回该节点相对基准的改动对象；无改动返回 null */
export function diffOf(n) {
  if (n.created) return null
  const o = n.orig
  const d = {}
  if (n.title !== o.title) d.title = n.title
  if (n.kind !== o.kind) d.kind = n.kind
  if ((n.ask || '') !== (o.ask || '')) d.ask = n.ask || null
  if (!arrEq(n.trigger, o.trigger)) d.trigger = n.trigger
  if (!arrEq(n.negate, o.negate)) d.negate = n.negate
  if (!pathsEq(n.needs, n.needsBaseline || o.needs)) d.needs = n.needs
  if (!arrEq(n.contraindications, o.contraindications)) d.contraindications = n.contraindications
  return Object.keys(d).length ? d : null
}

export function arrEq(a, b) {
  a = a || []; b = b || []
  return a.length === b.length && a.every((x, i) => x === b[i])
}

export function pathsEq(a, b) {
  a = a || []; b = b || []
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j].ref !== b[i][j].ref || a[i][j].pol !== b[i][j].pol) return false
    }
  }
  return true
}

export function dirtyNames() {
  return S.order.filter(n => S.nodes.has(n) && isDirty(n))
}

export function recomputeDirty() {
  const n = dirtyNames().length
  emit('dirty', n)
  return n
}

/** 谁引用了 name（用于删除/改名的影响分析） */
export function usersOf(name) {
  const out = []
  for (const n of allNodes()) {
    n.needs.forEach((p, pi) => p.forEach((c, ci) => {
      if (c.ref === name) out.push({ node: n.name, title: n.title, path: pi, cond: ci, pol: c.pol })
    }))
  }
  return out
}

// ------------------------------------------------------------
// 编辑操作
// ------------------------------------------------------------

/**
 * 改字段。为了让「连续输入标题」只产生一条撤销记录，
 * 同一个节点 + 同一组字段在 900ms 内的连续修改只快照一次。
 */
let lastUpdate = { key: null, t: 0 }
export function update(name, patch) {
  const n = S.nodes.get(name)
  if (!n) return
  const key = name + ':' + Object.keys(patch).sort().join(',')
  const now = Date.now()
  if (lastUpdate.key !== key || now - lastUpdate.t > 900) snap()
  lastUpdate = { key, t: now }
  Object.assign(n, patch)
  recomputeDirty()
  emit('model-changed', { name })
}

export function mkNode(spec) {
  const name = spec.name
  const node = {
    name,
    title: spec.title,
    kind: spec.kind,
    dir: S.dirs[spec.kind] || 'symptoms',
    file: name + '.js',
    isLeaf: spec.kind === 'symptom' || spec.kind === 'pulse',
    editable: true,
    readOnlyReason: null,
    fileHash: null,
    trigger: spec.trigger || [],
    negate: spec.negate || [],
    ask: spec.ask || '',
    needs: spec.needs || [],
    contraindications: spec.contraindications || [],
    modes: { trigger: 'none', negate: 'none', needs: 'none' },
    renamedFrom: null,
    needsBaseline: null,
    created: true,
    orig: null
  }
  return node
}

export function addNode(spec) {
  snap()
  const n = mkNode(spec)
  S.nodes.set(n.name, n)
  S.order.push(n.name)
  S.created.add(n.name)
  const col = { symptom: 0, pulse: 0, summary: 1, formula: 2 }[n.kind] || 0
  if (!S.layout.nodes[n.name]) S.layout.nodes[n.name] = { x: 80 + col * 360, y: 80 + Object.keys(S.layout.nodes).length * 10 }
  S.sel = new Set([n.name])
  recomputeDirty()
  emit('model-changed')
  return n
}

/** 改名：同步更新所有 needs 引用（前端显示层），并把结果记入 needsBaseline */
export function renameNode(from, to) {
  const n = S.nodes.get(from)
  if (!n || S.nodes.has(to)) return false
  snap()
  n.name = to
  n.file = to + '.js'
  if (!n.created && !n.renamedFrom) n.renamedFrom = from
  // 移动键
  S.nodes.delete(from)
  S.nodes.set(to, n)
  S.order = S.order.map(x => (x === from ? to : x))
  // 位置
  if (S.layout.nodes[from]) { S.layout.nodes[to] = S.layout.nodes[from]; delete S.layout.nodes[from] }
  // 引用改写
  for (const m of allNodes()) {
    let touched = false
    m.needs = m.needs.map(p => p.map(c => {
      if (c.ref === from) { touched = true; return { ref: to, pol: c.pol } }
      return c
    }))
    if (touched && !m.created) {
      // 只记基准，不算作用户改动；服务端会做同样的字符串级改写
      m.needsBaseline = clone(m.needs)
    }
  }
  S.sel = new Set([to])
  recomputeDirty()
  emit('model-changed')
  return true
}

export function deleteNode(name) {
  const n = S.nodes.get(name)
  if (!n) return
  snap()
  // 先记录哪些节点本来就有「用户改动过的 needs」，删引用之后再决定基准怎么处理
  const userEdited = new Set()
  for (const m of allNodes()) {
    if (m.name === name) continue
    const base = m.needsBaseline || m.orig.needs
    if (!pathsEq(m.needs, base)) userEdited.add(m.name)
  }

  S.nodes.delete(name)
  S.order = S.order.filter(x => x !== name)
  S.created.delete(name)
  // 关键：
  //  · 新建后又被删除的节点在磁盘上从不存在 → 不该出现在载荷里
  //  · 改名后又被删除的节点 → 要删的是它的「原名」文件，否则服务端找不到该节点
  if (!n.created) S.deleted.add(n.renamedFrom || name)
  delete S.layout.nodes[name]
  S.sel.delete(name)

  // 同服务端的 unlink 语义：把这个节点从所有引用处摘掉，避免画布上留下悬空连线
  for (const m of allNodes()) {
    let touched = false
    m.needs = m.needs
      .map(p => p.filter(c => { if (c.ref === name) { touched = true; return false } return true }))
      .filter(p => p.length)
    if (!touched) continue
    if (userEdited.has(m.name)) {
      // 用户本来就改过这个节点的条件 → 让载荷带上显式 needs（diff 里能看到全貌）
      m.needsBaseline = null
    } else {
      // 只是「因为删节点」才变的 → 对齐基准，交给服务端做字符串级摘除（注释不丢）
      m.needsBaseline = clone(m.needs)
    }
  }

  recomputeDirty()
  emit('model-changed')
}

export function addCondition(targetName, ref, pol, pathIndex) {
  const t = S.nodes.get(targetName)
  if (!t) return
  if (!t.needs.length) t.needs = [[]]
  let pi
  if (pathIndex === null || pathIndex === undefined) pi = t.needs.length - 1
  else if (pathIndex >= t.needs.length) { t.needs.push([]); pi = t.needs.length - 1 }
  else pi = pathIndex
  if (t.needs[pi].some(c => c.ref === ref)) return
  snap()
  t.needs[pi].push({ ref, pol: pol || 'yes' })
  recomputeDirty()
  emit('model-changed')
}

export function removeCondition(targetName, pathIndex, condIndex) {
  const t = S.nodes.get(targetName)
  if (!t || !t.needs[pathIndex]) return
  snap()
  t.needs[pathIndex].splice(condIndex, 1)
  if (!t.needs[pathIndex].length) t.needs.splice(pathIndex, 1)
  recomputeDirty()
  emit('model-changed')
}

export function moveCondition(targetName, fromPath, condIndex, toPath) {
  const t = S.nodes.get(targetName)
  if (!t || fromPath === toPath) return
  snap()
  const [c] = t.needs[fromPath].splice(condIndex, 1)
  if (!t.needs[fromPath].length) t.needs.splice(fromPath, 1)
  const dst = Math.min(toPath, t.needs.length - 1)
  if (dst < 0) t.needs.push([c]); else t.needs[dst].push(c)
  recomputeDirty()
  emit('model-changed')
}

export function setPolarity(targetName, pathIndex, condIndex, pol) {
  const t = S.nodes.get(targetName)
  if (!t || !t.needs[pathIndex] || !t.needs[pathIndex][condIndex]) return
  snap()
  t.needs[pathIndex][condIndex].pol = pol
  recomputeDirty()
  emit('model-changed')
}

export function addPath(targetName) {
  const t = S.nodes.get(targetName)
  if (!t) return
  // 已经有一条空路径就不再叠加（空路径会被引擎当作「永远成立」，保存时也会被阻止）
  if (t.needs.length && t.needs[t.needs.length - 1].length === 0) return
  snap()
  t.needs.push([])
  recomputeDirty()
  emit('model-changed')
}

export function removePath(targetName, pathIndex) {
  const t = S.nodes.get(targetName)
  if (!t) return
  snap()
  t.needs.splice(pathIndex, 1)
  recomputeDirty()
  emit('model-changed')
}

export function clearConditionFlags(name) {
  const n = S.nodes.get(name)
  if (!n) return
  n.needsBaseline = null
}

// ------------------------------------------------------------
// 保存载荷
// ------------------------------------------------------------

export function buildPayload() {
  const updated = []
  const created = []
  const renamed = []
  const deleted = []

  for (const n of allNodes()) {
    if (n.created) {
      created.push({
        name: n.name, title: n.title, kind: n.kind,
        trigger: n.trigger, negate: n.negate, ask: n.ask || null,
        needs: n.needs, contraindications: n.contraindications
      })
      continue
    }
    if (n.renamedFrom) renamed.push({ from: n.renamedFrom, to: n.name })
    const d = diffOf(n)
    if (d) updated.push(Object.assign({ name: n.renamedFrom || n.name, baseHash: n.renamedFrom ? null : n.fileHash }, d))
  }
  for (const name of S.deleted) deleted.push({ name, mode: 'unlink' })

  return {
    dryRun: true,
    updated, created, renamed, deleted,
    layout: { nodes: S.layout.nodes, viewport: S.view }
  }
}

export function hasChanges() {
  return dirtyNames().length > 0
}
