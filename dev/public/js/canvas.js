// dev/public/js/canvas.js
// SVG 节点画布：渲染 + 平移/缩放 + 框选 + 拖拽 + 连线 + 选中
//
// 图的方向：条件节点(右侧出线) → 依赖它的节点(左侧入线)
//   needs 里的 {ref:'fever', pol:'no'} 表示「要有发热」还是「不能有发热」
//   连线颜色：是=青绿实线，非=红色虚线（线上标「非」）

import { S, emit, allNodes } from './store.js'
import { nodeSize, nodeWidth, autoLayout, neighborhood, NODE_H } from './layout.js'
import { esc } from './ui.js'

const NS = 'http://www.w3.org/2000/svg'
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']

let svg, layerGrid, layerEdges, layerNodes, layerOverlay, marqueeEl, gridRect
let minimapSvg, minimapView
let raf = null
let visible = new Set()

export const hooks = {
  onSelect: null,          // (names) => void
  onLinkDrop: null,        // (fromName, toName, pol) => void
  onLinkEmptyDrop: null,   // (fromName, worldPos, pol) => void  拖到空白处松开
  onCreateAt: null,        // (worldPos, clientX, clientY) => void  双击空白处
  onContext: null,         // (name, clientX, clientY) => void
  onEdgeSelect: null       // (edge) => void
}

// ------------------------------------------------------------
// 坐标与视图
// ------------------------------------------------------------

function applyView() {
  const t = `translate(${S.view.x},${S.view.y}) scale(${S.view.k})`
  ;[layerGrid, layerEdges, layerNodes, layerOverlay].forEach(g => g.setAttribute('transform', t))
  const zl = document.getElementById('zoom-label')
  if (zl) zl.textContent = Math.round(S.view.k * 100) + '%'
  const sz = document.getElementById('status-zoom')
  if (sz) sz.textContent = '缩放 ' + Math.round(S.view.k * 100) + '% · 视图 ' + Math.round(S.view.x) + ',' + Math.round(S.view.y)
  updateMinimapViewport()
}

export function screenToWorld(clientX, clientY) {
  const r = svg.getBoundingClientRect()
  return {
    x: (clientX - r.left - S.view.x) / S.view.k,
    y: (clientY - r.top - S.view.y) / S.view.k
  }
}

export function setView(x, y, k) {
  S.view.x = x
  S.view.y = y
  if (k) S.view.k = Math.max(0.12, Math.min(3, k))
  applyView()
}

export function zoomBy(factor, clientX, clientY) {
  const r = svg.getBoundingClientRect()
  const cx = (clientX == null ? r.left + r.width / 2 : clientX)
  const cy = (clientY == null ? r.top + r.height / 2 : clientY)
  const before = screenToWorld(cx, cy)
  const k = Math.max(0.12, Math.min(3, S.view.k * factor))
  S.view.k = k
  S.view.x = cx - r.left - before.x * k
  S.view.y = cy - r.top - before.y * k
  applyView()
}

function bounds(nodes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const n of nodes) {
    const p = S.layout.nodes[n.name]
    if (!p) continue
    const { w, h } = nodeSize(n)
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + h)
  }
  if (x0 === Infinity) return { x0: 0, y0: 0, x1: 800, y1: 600 }
  return { x0, y0, x1, y1 }
}

export function fitView(onlyVisible) {
  const list = (onlyVisible && visible.size ? allNodes().filter(n => visible.has(n.name)) : allNodes())
  if (!list.length) return
  const b = bounds(list)
  const r = svg.getBoundingClientRect()
  const pad = 60
  const kx = (r.width - pad * 2) / Math.max(1, b.x1 - b.x0)
  const ky = (r.height - pad * 2) / Math.max(1, b.y1 - b.y0)
  const k = Math.max(0.12, Math.min(1.6, Math.min(kx, ky)))
  S.view.k = k
  S.view.x = pad - b.x0 * k + Math.max(0, (r.width - pad * 2 - (b.x1 - b.x0) * k) / 2)
  S.view.y = pad - b.y0 * k + Math.max(0, (r.height - pad * 2 - (b.y1 - b.y0) * k) / 2)
  applyView()
}

export function centerOn(name) {
  const p = S.layout.nodes[name]
  if (!p) return
  const n = allNodes().find(x => x.name === name)
  const { w, h } = n ? nodeSize(n) : { w: 150, h: NODE_H }
  const r = svg.getBoundingClientRect()
  S.view.x = r.width / 2 - (p.x + w / 2) * S.view.k
  S.view.y = r.height / 2 - (p.y + h / 2) * S.view.k
  applyView()
}

// ------------------------------------------------------------
// 可见性（聚焦 / 筛选 / 只看有问题）
// ------------------------------------------------------------

export function computeVisible() {
  const nodes = allNodes()
  let base = new Set(nodes.map(n => n.name))

  if (S.focus && S.sel.size) {
    base = neighborhood([...S.sel], nodes, S.focusDepth || 2)
  }
  if (S.kindFilter.size) {
    for (const n of nodes) if (!S.kindFilter.has(n.kind)) base.delete(n.name)
    // 聚焦模式下筛掉的节点若仍被显示节点依赖，保留以免图断裂
  }
  if (S.flagFilter.size) {
    const stats = S.stats || {}
    for (const n of nodes) {
      const isOrphan = (stats.orphans || []).includes(n.name)
      const isOr = n.needs.length > 1
      const isDirty = !!n.renamedFrom || n.created || (n.needsBaseline && JSON.stringify(n.needs) !== JSON.stringify(n.needsBaseline))
      let keep = false
      if (S.flagFilter.has('orphan') && isOrphan) keep = true
      if (S.flagFilter.has('or') && isOr) keep = true
      if (S.flagFilter.has('dirty') && isDirty) keep = true
      if (!keep) base.delete(n.name)
    }
  }
  if (S.search) {
    const q = S.search.toLowerCase()
    for (const n of nodes) {
      const hit = (n.title || '').toLowerCase().includes(q) ||
        (n.name || '').toLowerCase().includes(q) ||
        (n.trigger || []).some(k => k.toLowerCase().includes(q)) ||
        (n.ask || '').toLowerCase().includes(q)
      if (!hit) base.delete(n.name)
    }
  }
  if (S.onlyIssues) {
    const stats = S.stats || {}
    const bad = new Set([...(stats.dangling || []).map(d => d.from), ...(stats.orphans || []), ...(stats.selfContra || []).map(d => d.node), ...(stats.selfRef || [])])
    if (S.sim && S.sim.conflicts) S.sim.conflicts.forEach(c => bad.add(c.name))
    for (const n of nodes) if (!bad.has(n.name)) base.delete(n.name)
  }
  visible = base
  return base
}

// ------------------------------------------------------------
// 渲染
// ------------------------------------------------------------

function simStateOf(name) {
  if (!S.simColor || !S.sim || !S.sim.states) return null
  return S.sim.states[name] || 'unknown'
}

/** 该条件在当前模拟下的判定：'ok' | 'no' | 'unknown' */
function condEval(targetName, ref, pol) {
  if (!S.sim || !S.simColor) return null
  const ex = S.sim.explanations && S.sim.explanations[targetName]
  if (!ex) return null
  for (const p of ex.paths) {
    for (const c of p.conds) {
      if (c.ref === ref && c.want === pol) return c.ok ? 'ok' : (c.unknown ? 'unknown' : 'no')
    }
  }
  return null
}

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag)
  if (attrs) for (const k of Object.keys(attrs)) {
    if (attrs[k] === null || attrs[k] === undefined) continue
    e.setAttribute(k, attrs[k])
  }
  if (text !== undefined && text !== null) e.textContent = text
  return e
}

function renderEdges(nodes) {
  const byName = new Map(nodes.map(n => [n.name, n]))
  const frag = document.createDocumentFragment()

  for (const n of nodes) {
    if (!visible.has(n.name)) continue
    const tp = S.layout.nodes[n.name]
    if (!tp) continue
    const { w, h } = nodeSize(n)
    const showPaths = n.needs.length > 1

    n.needs.forEach((path, pi) => {
      path.forEach((c, ci) => {
        const src = byName.get(c.ref)
        if (!src || !visible.has(c.ref)) return
        const sp = S.layout.nodes[c.ref]
        if (!sp) return
        const sw = nodeWidth(src)
        const sx = sp.x + sw
        const sy = sp.y + NODE_H / 2
        const tx = tp.x
        const ty = tp.y + h / 2
        const dx = Math.max(36, Math.min(180, Math.abs(tx - sx) * 0.42))
        const d = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`

        const ev = condEval(n.name, c.ref, c.pol)
        const cls = ['edge', c.pol === 'no' ? 'edge-no' : 'edge-yes', 'edge-path-' + (pi % 4)]
        const isSel = S.selEdge && S.selEdge.from === n.name && S.selEdge.to === c.ref && S.selEdge.path === pi && S.selEdge.cond === ci
        if (isSel) cls.push('selected')
        const p = el('path', {
          class: cls.join(' '),
          d,
          'data-from': n.name,
          'data-to': c.ref,
          'data-path': pi,
          'data-cond': ci,
          opacity: ev === null ? 1 : (ev === 'ok' ? 1 : (ev === 'unknown' ? 0.7 : 0.22)),
          'marker-end': S.showArrows ? (c.pol === 'no' ? 'url(#arrow-no)' : 'url(#arrow-yes)') : null
        })
        // 悬停原生提示：把「路径序号 + 哪个症状 + 是/非 + 目标方剂」写清楚
        p.appendChild(el('title', {}, `路径${CIRCLED[pi] || (pi + 1)}：${src.title || c.ref}（${c.pol === 'no' ? '非' : '是'}） → ${n.title}`))
        frag.appendChild(p)

        // 标签：非 / 路径序号
        const mx = (sx + tx) / 2
        const my = (sy + ty) / 2 - 4
        const label = []
        if (c.pol === 'no') label.push('非')
        if (showPaths) label.push('①②③④⑤⑥'[pi] || ('P' + (pi + 1)))
        if (label.length) {
          const t = el('text', {
            class: 'edge-label', x: mx, y: my, 'text-anchor': 'middle',
            fill: c.pol === 'no' ? '#fb7185' : '#94a3b8'
          }, label.join(' '))
          frag.appendChild(t)
        }
      })
    })
  }
  layerEdges.innerHTML = ''
  layerEdges.appendChild(frag)
}

function renderNodes(nodes) {
  const frag = document.createDocumentFragment()
  for (const n of nodes) {
    const p = S.layout.nodes[n.name] || { x: 0, y: 0 }
    const { w, h } = nodeSize(n)
    const st = simStateOf(n.name)
    const cls = ['gnode', 'kind-' + n.kind]
    if (st) cls.push('state-' + st)
    if (S.sel.has(n.name)) cls.push('selected')
    if (!visible.has(n.name)) cls.push('dim')
    if (S.sim && S.sim.conflicts && S.sim.conflicts.some(c => c.name === n.name)) cls.push('conflict')
    if (n.renamedFrom || n.created || (n.needsBaseline && JSON.stringify(n.needs) !== JSON.stringify(n.needsBaseline))) cls.push('dirty')

    const g = el('g', { class: cls.join(' '), transform: `translate(${p.x},${p.y})`, 'data-name': n.name })
    g.appendChild(el('rect', { class: 'node-box', x: 0, y: 0, width: w, height: h, rx: 10 }))
    g.appendChild(el('rect', { class: 'node-accent', x: 0, y: 0, width: 4, height: h, rx: 2 }))
    // 三行分区（h=70）：标题 11–26 / name 30–41 / 徽标行 46–62，行间各留 4~5px
    g.appendChild(el('text', { class: 'node-title', x: 14, y: 22 }, n.title || n.name))
    g.appendChild(el('text', { class: 'node-name', x: 14, y: 38 }, n.name))

    // 徽标：触发词数 / 路径数(OR) / 禁忌数
    const badges = []
    if (n.trigger && n.trigger.length) badges.push(n.trigger.length + '词')
    if (n.negate && n.negate.length) badges.push('否' + n.negate.length)
    if (n.needs.length > 1) badges.push(n.needs.length + '路径')
    else if (n.needs.length === 1) badges.push(n.needs[0].length + '条件')
    if (n.contraindications && n.contraindications.length) badges.push('禁忌' + n.contraindications.length)
    const badgeH = 16
    const badgeY = h - 24
    let bx = 14
    for (const b of badges.slice(0, 3)) {
      const bw = 9 + b.length * 7
      g.appendChild(el('rect', { class: 'badge-bg', x: bx, y: badgeY, width: bw, height: badgeH, rx: 4 }))
      g.appendChild(el('text', { class: 'badge-t', x: bx + 4.5, y: badgeY + 11.5 }, b))
      bx += bw + 5
    }

    if (st) {
      const label = st === 'yes' ? '是' : (st === 'no' ? '否' : '未知')
      g.appendChild(el('text', {
        class: 'node-state', x: w - 12, y: badgeY + 11.5, 'text-anchor': 'end',
        fill: st === 'yes' ? '#34d399' : (st === 'no' ? '#f87171' : '#64748b')
      }, label))
    }

    // 未保存标记：SVG 里 ::after 不生效，用真实 circle 画（CSS 已有 circle.dirty-dot）
    if (cls.includes('dirty')) {
      g.appendChild(el('circle', { class: 'dirty-dot', cx: w - 7, cy: 7, r: 4.5 }))
    }

    // 端口
    g.appendChild(el('circle', { class: 'port port-in', cx: 0, cy: h / 2, r: 6, 'data-port': 'in', 'data-name': n.name }))
    g.appendChild(el('circle', { class: 'port port-out', cx: w, cy: h / 2, r: 6, 'data-port': 'out', 'data-name': n.name }))

    frag.appendChild(g)
  }
  layerNodes.innerHTML = ''
  layerNodes.appendChild(frag)
}

/**
 * 「路径一览」浮层：选中任一有依赖条件的节点时，在它下方列出
 * 每条路径的具体症状（中文名 + 是/非 + 当前模拟状态 + 本条路径结论）。
 * 起因：画布上只看连线和小徽标（如「3路径」）根本看不出这条路径要哪些症状。
 */
function renderLegend(nodes) {
  const old = layerOverlay.querySelector('.legend')
  if (old) old.remove()
  if (S.sel.size !== 1) return
  const selName = [...S.sel][0]
  const n = nodes.find(x => x.name === selName)
  if (!n || !n.needs.length) return
  const p = S.layout.nodes[selName]
  if (!p) return

  const byName = new Map(nodes.map(x => [x.name, x]))
  const { h } = nodeSize(n)
  const ex = S.sim && S.sim.explanations ? S.sim.explanations[n.name] : null
  const MAXROWS = 6

  const rows = n.needs.slice(0, MAXROWS).map((path, pi) => {
    const segs = path.map(c => {
      const t = byName.get(c.ref)
      const label = (t ? (t.title || t.name) : c.ref + '（不存在）') + (c.pol === 'no' ? '(非)' : '')
      const ev = condEval(n.name, c.ref, c.pol)
      const color = ev === 'ok' ? '#34d399'
        : ev === 'no' ? '#f87171'
          : ev === 'unknown' ? '#94a3b8'
            : (c.pol === 'no' ? '#fb7185' : '#5eead4')
      return { label, color }
    })
    const pe = ex && ex.paths ? ex.paths[pi] : null
    const status = pe
      ? (pe.status === 'ok' ? { t: '✓ 全部满足', c: '#34d399' }
        : pe.status === 'blocked' ? { t: '✗ 被阻断', c: '#f87171' }
          : { t: '待确认', c: '#fbbf24' })
      : null
    return { pi, segs, status }
  })

  const padX = 11, padY = 9, lineH = 17, headH = 19
  let chars = 0
  rows.forEach(r => { chars = Math.max(chars, r.segs.reduce((a, s) => a + s.label.length + 3, 0) + 14) })
  const boxW = Math.min(600, Math.max(240, chars * 12 + padX * 2))
  const boxH = padY * 2 + headH + rows.length * lineH + (n.needs.length > MAXROWS ? lineH : 0)

  const g = el('g', { class: 'legend', transform: `translate(${p.x},${p.y + h + 10})` })
  g.appendChild(el('rect', {
    x: 0, y: 0, width: boxW, height: boxH, rx: 8,
    fill: 'rgba(9,13,18,.95)', stroke: 'rgba(255,255,255,.16)', 'stroke-width': 1
  }))
  const total = n.needs.reduce((a, x) => a + x.length, 0)
  g.appendChild(el('text', {
    x: padX, y: padY + 12, fill: '#93a4b8', 'font-size': 11, 'font-weight': 600
  }, `路径一览：${n.needs.length} 条${n.needs.length > 1 ? '（任一条全部满足即成立）' : ''} · 共 ${total} 个条件`))

  rows.forEach((r, i) => {
    const ty = padY + headH + i * lineH + 4
    const t = el('text', { x: padX, y: ty, 'font-size': 11.5 })
    t.appendChild(el('tspan', { fill: '#fbbf24', 'font-weight': 600 }, '路径' + (CIRCLED[r.pi] || (r.pi + 1)) + ' '))
    r.segs.forEach((s, k) => {
      if (k) t.appendChild(el('tspan', { fill: '#475569' }, ' · '))
      t.appendChild(el('tspan', { fill: s.color }, s.label))
    })
    g.appendChild(t)
    if (r.status) {
      g.appendChild(el('text', { x: boxW - padX, y: ty, 'text-anchor': 'end', 'font-size': 11, fill: r.status.c }, r.status.t))
    }
  })

  if (n.needs.length > MAXROWS) {
    g.appendChild(el('text', {
      x: padX, y: padY + headH + rows.length * lineH + 4, 'font-size': 11, fill: '#64748b'
    }, `…还有 ${n.needs.length - MAXROWS} 条路径（完整列表见右侧「检视器」）`))
  }

  layerOverlay.appendChild(g)
}

function renderMinimap(nodes) {
  if (!minimapSvg) return
  const b = bounds(nodes)
  const pad = 20
  const w = b.x1 - b.x0 + pad * 2
  const h = b.y1 - b.y0 + pad * 2
  minimapSvg.setAttribute('viewBox', `${b.x0 - pad} ${b.y0 - pad} ${w} ${h}`)
  const frag = document.createDocumentFragment()
  for (const n of nodes) {
    const p = S.layout.nodes[n.name]
    if (!p) continue
    const sz = nodeSize(n)
    const r = el('rect', {
      class: 'mm-node kind-' + n.kind, x: p.x, y: p.y, width: sz.w, height: sz.h, rx: 4,
      opacity: visible.has(n.name) ? 0.9 : 0.2
    })
    frag.appendChild(r)
  }
  minimapSvg.innerHTML = ''
  minimapSvg.appendChild(frag)
  updateMinimapViewport()
}

function updateMinimapViewport() {
  if (!minimapView || !minimapSvg) return
  const vb = minimapSvg.viewBox.baseVal
  if (!vb || !vb.width) return
  const r = svg.getBoundingClientRect()
  const box = minimapSvg.parentElement.getBoundingClientRect()
  const innerW = box.width, innerH = box.height
  const scale = Math.min(innerW / vb.width, innerH / vb.height)
  const offX = (innerW - vb.width * scale) / 2
  const offY = (innerH - vb.height * scale) / 2
  const vx = -S.view.x / S.view.k
  const vy = -S.view.y / S.view.k
  const vw = r.width / S.view.k
  const vh = r.height / S.view.k
  const left = offX + (vx - vb.x) * scale
  const top = offY + (vy - vb.y) * scale
  minimapView.style.left = left + 'px'
  minimapView.style.top = top + 'px'
  minimapView.style.width = Math.max(6, vw * scale) + 'px'
  minimapView.style.height = Math.max(6, vh * scale) + 'px'
}

/** 全量重绘（位置/数据变化时调用） */
export function render() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = null
    const nodes = allNodes()
    // 首次或强制：为缺少坐标的节点补布局
    const missing = nodes.filter(n => !S.layout.nodes[n.name])
    if (missing.length) {
      const res = autoLayout(nodes, S.layout.nodes, { force: false })
      S.layout.nodes = res.nodes
      emit('layout-filled')
    }
    computeVisible()
    renderEdges(nodes)
    renderNodes(nodes)
    renderLegend(nodes)
    renderMinimap(nodes)
    applyView()
    const sc = document.getElementById('list-count')
    if (sc) sc.textContent = visible.size === nodes.length ? (nodes.length + ' 个') : (visible.size + ' / ' + nodes.length)
  })
}

export function relayoutAll(nodes) {
  const res = autoLayout(nodes, {}, { force: true })
  S.layout.nodes = res.nodes
  emit('layout-changed')
  render()
  setTimeout(() => fitView(false), 30)
}

// ------------------------------------------------------------
// 交互
// ------------------------------------------------------------

export function initCanvas() {
  svg = document.getElementById('canvas')
  layerGrid = document.getElementById('layer-grid')
  layerEdges = document.getElementById('layer-edges')
  layerNodes = document.getElementById('layer-nodes')
  layerOverlay = document.getElementById('layer-overlay')
  marqueeEl = document.getElementById('marquee')
  gridRect = document.getElementById('grid-rect')
  minimapSvg = document.getElementById('minimap-svg')
  minimapView = document.getElementById('minimap-view')

  let space = false
  let mode = null          // 'pan' | 'marquee' | 'drag' | 'link'
  let start = null
  let linkFrom = null
  let linkPath = null
  let dragOffsets = []
  let moved = false

  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !isTyping(e.target)) { space = true; svg.style.cursor = 'grab' }
  })
  window.addEventListener('keyup', e => {
    if (e.code === 'Space') { space = false; svg.style.cursor = '' }
  })

  svg.addEventListener('wheel', e => {
    e.preventDefault()
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
    zoomBy(f, e.clientX, e.clientY)
  }, { passive: false })

  svg.addEventListener('mousedown', e => {
    if (e.button === 2) return
    const port = e.target.closest && e.target.closest('.port')
    const gnode = e.target.closest && e.target.closest('.gnode')

    if (port && port.dataset.port === 'out') {
      mode = 'link'
      linkFrom = port.dataset.name
      const w = screenToWorld(e.clientX, e.clientY)
      const p = S.layout.nodes[linkFrom]
      const n = allNodes().find(x => x.name === linkFrom)
      const sx = (p ? p.x : 0) + (n ? nodeWidth(n) : 120)
      const sy = (p ? p.y : 0) + NODE_H / 2
      linkPath = el('path', { class: 'edge edge-yes', d: `M ${sx} ${sy} L ${w.x} ${w.y}`, opacity: 0.85, 'stroke-dasharray': '5 4' })
      layerOverlay.appendChild(linkPath)
      port.classList.add('active')
      e.preventDefault()
      return
    }

    if (e.button === 1 || space) {
      mode = 'pan'
      start = { x: e.clientX, y: e.clientY, vx: S.view.x, vy: S.view.y }
      svg.style.cursor = 'grabbing'
      e.preventDefault()
      return
    }

    if (gnode) {
      const name = gnode.dataset.name
      if (e.shiftKey) {
        if (S.sel.has(name)) S.sel.delete(name); else S.sel.add(name)
      } else if (!S.sel.has(name)) {
        S.sel = new Set([name])
      }
      S.selEdge = null
      if (hooks.onSelect) hooks.onSelect([...S.sel])
      // 拖动准备
      mode = 'drag'
      const w = screenToWorld(e.clientX, e.clientY)
      dragOffsets = [...S.sel].map(nm => {
        const p = S.layout.nodes[nm] || { x: 0, y: 0 }
        return { name: nm, dx: p.x - w.x, dy: p.y - w.y }
      })
      moved = false
      render()
      e.preventDefault()
      return
    }

    // 空白处：默认平移画布；按住 Shift 才框选
    const w0 = screenToWorld(e.clientX, e.clientY)
    if (e.shiftKey) {
      mode = 'marquee'
      start = { wx: w0.x, wy: w0.y, cx: e.clientX, cy: e.clientY }
      marqueeEl.setAttribute('visibility', 'visible')
      render()
      return
    }
    mode = 'pan'
    start = { x: e.clientX, y: e.clientY, vx: S.view.x, vy: S.view.y }
    svg.style.cursor = 'grabbing'
    S.sel = new Set(); S.selEdge = null
    if (hooks.onSelect) hooks.onSelect([])
    render()
  })

  window.addEventListener('mousemove', e => {
    if (!mode) return
    moved = true
    if (mode === 'pan') {
      S.view.x = start.vx + (e.clientX - start.x)
      S.view.y = start.vy + (e.clientY - start.y)
      applyView()
      return
    }
    if (mode === 'drag') {
      const w = screenToWorld(e.clientX, e.clientY)
      for (const d of dragOffsets) {
        S.layout.nodes[d.name] = { x: Math.round(w.x + d.dx), y: Math.round(w.y + d.dy) }
      }
      S.layoutDirty = true
      render()
      return
    }
    if (mode === 'link' && linkPath) {
      const w = screenToWorld(e.clientX, e.clientY)
      const p = S.layout.nodes[linkFrom]
      const n = allNodes().find(x => x.name === linkFrom)
      const sx = (p ? p.x : 0) + (n ? nodeWidth(n) : 120)
      const sy = (p ? p.y : 0) + NODE_H / 2
      linkPath.setAttribute('d', `M ${sx} ${sy} L ${w.x} ${w.y}`)
      return
    }
    if (mode === 'marquee') {
      const w = screenToWorld(e.clientX, e.clientY)
      const x0 = Math.min(start.wx, w.x), x1 = Math.max(start.wx, w.x)
      const y0 = Math.min(start.wy, w.y), y1 = Math.max(start.wy, w.y)
      marqueeEl.setAttribute('x', x0)
      marqueeEl.setAttribute('y', y0)
      marqueeEl.setAttribute('width', x1 - x0)
      marqueeEl.setAttribute('height', y1 - y0)
      // 实时高亮
      S.sel = new Set()
      for (const n of allNodes()) {
        const p = S.layout.nodes[n.name]
        if (!p || !visible.has(n.name)) continue
        const sz = nodeSize(n)
        const hit = !(p.x > x1 || p.x + sz.w < x0 || p.y > y1 || p.y + sz.h < y0)
        if (hit) S.sel.add(n.name)
      }
      if (hooks.onSelect) hooks.onSelect([...S.sel])
      render()
    }
  })

  window.addEventListener('mouseup', e => {
    if (mode === 'link') {
      const port = e.target.closest && e.target.closest('.port')
      const gnode = e.target.closest && e.target.closest('.gnode')
      if (linkPath) linkPath.remove()
      layerNodes.querySelectorAll('.port.active').forEach(x => x.classList.remove('active'))
      const target = gnode ? gnode.dataset.name : null
      if (target && target !== linkFrom && hooks.onLinkDrop) {
        hooks.onLinkDrop(linkFrom, target, e.altKey ? 'no' : 'yes')
      } else if (!target && linkFrom && hooks.onLinkEmptyDrop) {
        // 拖到空白处松开：在那里新建节点并自动连上
        const w = screenToWorld(e.clientX, e.clientY)
        hooks.onLinkEmptyDrop(linkFrom, { x: Math.round(w.x), y: Math.round(w.y) },
          e.altKey ? 'no' : 'yes', e.clientX, e.clientY)
      }
      linkPath = null
      linkFrom = null
    }
    if (mode === 'marquee') {
      marqueeEl.setAttribute('visibility', 'hidden')
      marqueeEl.setAttribute('width', 0)
      marqueeEl.setAttribute('height', 0)
    }
    if (mode === 'pan') svg.style.cursor = space ? 'grab' : ''
    mode = null
    start = null
  })

  // 点击连线 / 右键菜单
  svg.addEventListener('click', e => {
    const p = e.target.closest && e.target.closest('path.edge')
    if (p && p.dataset && p.dataset.from) {
      S.selEdge = { from: p.dataset.from, to: p.dataset.to, path: Number(p.dataset.path), cond: Number(p.dataset.cond) }
      S.sel = new Set()
      if (hooks.onEdgeSelect) hooks.onEdgeSelect(S.selEdge)
      render()
    }
  })

  svg.addEventListener('dblclick', e => {
    const gnode = e.target.closest && e.target.closest('.gnode')
    if (gnode) { centerOn(gnode.dataset.name); zoomBy(1.15); return }
    if (e.target.closest && e.target.closest('.port')) return
    if (hooks.onCreateAt) {
      const w = screenToWorld(e.clientX, e.clientY)
      hooks.onCreateAt({ x: Math.round(w.x), y: Math.round(w.y) }, e.clientX, e.clientY)
      e.preventDefault()
    }
  })

  svg.addEventListener('contextmenu', e => {
    const gnode = e.target.closest && e.target.closest('.gnode')
    e.preventDefault()
    if (gnode && hooks.onContext) hooks.onContext(gnode.dataset.name, e.clientX, e.clientY)
  })

  // 小地图交互：点击跳转
  const mm = document.getElementById('minimap')
  if (mm) {
    mm.addEventListener('mousedown', e => {
      const box = mm.getBoundingClientRect()
      const svgBox = minimapSvg.getBoundingClientRect()
      const vb = minimapSvg.viewBox.baseVal
      const px = e.clientX - svgBox.left
      const py = e.clientY - svgBox.top
      const wx = vb.x + px / svgBox.width * vb.width
      const wy = vb.y + py / svgBox.height * vb.height
      const r = svg.getBoundingClientRect()
      S.view.x = r.width / 2 - wx * S.view.k
      S.view.y = r.height / 2 - wy * S.view.k
      applyView()
      e.preventDefault()
      e.stopPropagation()
    })
  }

  window.addEventListener('resize', () => { updateMinimapViewport(); applyView() })
}

function isTyping(t) {
  if (!t) return false
  const tag = (t.tagName || '').toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable
}

export function visibleSet() { return visible }
