'use strict'
// dev/public/js/inspector.js
// 检视器：编辑当前选中的节点 / 连线
//
// 设计要点：
//   · 每次渲染都整段重建 container（幂等）。事件用 addEventListener 绑在「本次新建的根元素」上，
//     所以反复渲染不会累积重复监听器。
//   · 所有写入都走 store.js 的导出函数（它们内部已 emit('model-changed') 并 recomputeDirty），
//     这里不重复 emit，也不直接改 S —— 避免死循环。
//   · 引擎的真实语义（任一路径被明确阻断 → 整个节点判否）如实呈现，见 needsGroupHtml / pathStatusHtml。

import {
  S, update, renameNode, deleteNode, usersOf,
  addPath, removePath, addCondition, removeCondition, moveCondition, setPolarity
} from './store.js'
import { getSource } from './api.js'
import { esc, toast, openModal, confirmDialog, promptDialog, showSourceDialog } from './ui.js'

// ------------------------------------------------------------
// 模块状态：记住上次传入的容器与当前编辑对象
// ------------------------------------------------------------

let host = null        // 上次传入的容器
let mode = 'node'      // 'node' | 'edge'
let edgeRef = null     // 正在编辑的连线 {from,to,path,cond}

const KIND_LABEL = { symptom: '症状', pulse: '脉象', summary: '证候', formula: '方剂' }
const KIND_ORDER = ['symptom', 'pulse', 'summary', 'formula']
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫']

function kindLabel(kind) { return KIND_LABEL[kind] || '未知' }
function pathLabel(i) { return '路径 ' + (CIRCLED[i] || String(i + 1)) }
function listOf(v) { return Array.isArray(v) ? v : [] }

/** 请求 app.js 选中/聚焦某个节点（app.js 会注入 window.__devSelect；没有就静默忽略） */
function devSelect(name) {
  if (typeof window === 'undefined') return
  if (typeof window.__devSelect === 'function') window.__devSelect(name)
}

/** 三态 → 中文 */
function triLabel(s) { return s === 'yes' ? '是' : (s === 'no' ? '否' : '未知') }
function triColor(s) { return s === 'yes' ? 'var(--ok)' : (s === 'no' ? 'var(--danger)' : 'var(--text-2)') }

// ------------------------------------------------------------
// 焦点/滚动保持：整段重建 DOM 后把光标位置还原（否则打字会掉焦点）
// ------------------------------------------------------------

function snapUi(root) {
  const out = { fk: null, sel: null, scrolls: [] }
  if (typeof document === 'undefined') return out
  const a = document.activeElement
  try {
    if (a && root.contains && root.contains(a) && a.getAttribute) {
      out.fk = a.getAttribute('data-fk')
      if (out.fk && typeof a.selectionStart === 'number') out.sel = [a.selectionStart, a.selectionEnd]
    }
    root.querySelectorAll('[data-scroll]').forEach(el => out.scrolls.push([el.getAttribute('data-scroll'), el.scrollTop]))
  } catch (_) { /* 测试环境下的极简 DOM：忽略 */ }
  return out
}

function restoreUi(root, snap) {
  if (!snap) return
  try {
    snap.scrolls.forEach(([k, v]) => {
      const el = root.querySelector('[data-scroll="' + k + '"]')
      if (el) el.scrollTop = v
    })
    if (!snap.fk) return
    const a = root.querySelector('[data-fk="' + snap.fk + '"]')
    if (!a) return
    a.focus()
    if (snap.sel && a.setSelectionRange) a.setSelectionRange(snap.sel[0], snap.sel[1])
  } catch (_) { /* 忽略 */ }
}

// ------------------------------------------------------------
// 对外接口
// ------------------------------------------------------------

/** 渲染检视器（编辑当前选中的节点） */
export function renderInspector(container) {
  if (!container) return
  host = container
  mode = 'node'
  draw()
}

/** 重新渲染当前容器内容（app.js 在选中变化 / 模型变化后调用） */
export function refreshInspector() {
  if (!host) return
  draw()
}

/** 渲染连线检视器；edge = {from, to, path, cond}，含义：from 节点依赖 to 节点 */
export function renderEdgeInspector(container, edge) {
  if (!container) return
  host = container
  mode = 'edge'
  edgeRef = edge || null
  draw()
}

// ------------------------------------------------------------
// 渲染入口
// ------------------------------------------------------------

function draw() {
  if (!host) return
  const snap = snapUi(host)
  host.innerHTML = ''

  if (mode === 'edge' && edgeRef) {
    host.innerHTML = edgeHtml(edgeRef)
    const root = host.firstElementChild
    if (root) bindEdge(root, edgeRef)
    restoreUi(host, snap)
    return
  }

  const names = [...S.sel].filter(n => S.nodes.has(n))
  if (!names.length) {
    host.innerHTML = '<div class="insp-empty">在画布上点一个节点开始编辑'
      + '<br><span class="muted">点一条连线可以编辑「某个节点依赖某个节点」这一条条件</span></div>'
    return
  }

  const node = S.nodes.get(names[0])
  host.innerHTML = nodeHtml(node, names.length)
  const root = host.firstElementChild
  if (root) bindNode(root, node)
  restoreUi(host, snap)
}

// ------------------------------------------------------------
// 节点视图
// ------------------------------------------------------------

function nodeHtml(node, selCount) {
  const ro = node.editable === false
  const ex = (S.sim && S.sim.explanations) ? S.sim.explanations[node.name] : null
  const out = ['<div class="insp">']
  out.push(headHtml(node, selCount))
  out.push(actionsHtml(ro))
  if (ro) {
    out.push('<div class="warn">该插件无法在界面上编辑：' + esc(node.readOnlyReason || '源码不是标准写法')
      + '<br>可以用「查看源码」看磁盘上的真实内容（只读）。</div>')
  }
  out.push(basicHtml(node, ro))
  if (node.isLeaf) {
    out.push(tagGroupHtml(node, 'trigger', '触发关键词', ro,
      '病人说的话命中任一关键词即判为「有」。输入层节点靠这里被病人说话命中。'))
    out.push(tagGroupHtml(node, 'negate', '否定关键词', ro,
      '命中即判为「没有」；注意“不怕冷”这类词要写在否定词里，否则会被“怕冷”误判。'))
    out.push(askHtml(node, ro))
  }
  if (!node.isLeaf || listOf(node.needs).length) out.push(needsGroupHtml(node, ex, ro))
  out.push(tagGroupHtml(node, 'contraindications', '禁忌', ro,
    '成立的方剂/证候会把禁忌汇总给病人看。'))
  out.push(depGroupHtml(node))
  out.push('</div>')
  return out.join('')
}

function headHtml(node, selCount) {
  const badges = []
  if (node.created) badges.push('<span class="mini-badge">新建</span>')
  if (node.renamedFrom) badges.push('<span class="mini-badge">由 ' + esc(node.renamedFrom) + ' 改名</span>')
  const out = ['<div class="insp-head">']
  out.push('<span class="kind-tag kind-' + esc(node.kind) + '">' + esc(kindLabel(node.kind)) + '</span>')
  out.push('<h3 class="insp-title">' + esc(node.title || '（无中文标题）') + '</h3>')
  out.push('<code class="insp-name">' + esc(node.name) + '</code>')
  if (badges.length) out.push('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">' + badges.join('') + '</div>')
  if (selCount > 1) out.push('<div class="hint">当前选中 ' + selCount + ' 个节点，这里只编辑第一个。</div>')
  out.push('</div>')
  return out.join('')
}

function actionsHtml(ro) {
  return '<div class="insp-actions">'
    + '<button class="btn btn-sm" data-act="rename"' + (ro ? ' disabled' : '') + '>重命名</button>'
    + '<button class="btn btn-sm btn-danger" data-act="delete"' + (ro ? ' disabled' : '') + '>删除</button>'
    + '<button class="btn btn-sm btn-ghost" data-act="source">查看源码</button>'
    + '</div>'
}

function basicHtml(node, ro) {
  const opts = KIND_ORDER.map(k =>
    '<option value="' + k + '"' + (k === node.kind ? ' selected' : '') + '>' + kindLabel(k) + '</option>').join('')
  return '<div class="field-group">'
    + '<div class="field-group-head"><span>基本信息</span><span class="hint mono">' + esc(node.file || '') + '</span></div>'
    + '<div class="field"><div class="field-label">中文标题</div>'
    + '<input class="input" data-fk="title" value="' + esc(node.title || '') + '" placeholder="例如：发热"'
    + (ro ? ' disabled' : '') + '></div>'
    + '<div class="field"><div class="field-label">类型</div>'
    + '<select class="select" data-fk="kind"' + (ro ? ' disabled' : '') + '>' + opts + '</select>'
    + '<div class="hint">改类型会在保存时把文件搬到对应目录（症状→symptoms、脉象→pulses、证候→syndromes、方剂→formulas），这一步由服务端完成。</div>'
    + '</div></div>'
}

/** 标签编辑器（trigger / negate / contraindications 共用） */
function tagGroupHtml(node, key, label, ro, hint) {
  const custom = !!(node.modes && node.modes[key] === 'custom')
  const n = listOf(node[key]).length
  const out = ['<div class="field-group">']
  out.push('<div class="field-group-head"><span>' + esc(label) + '</span>'
    + '<span class="hint" data-count="' + key + '">' + n + ' 个</span></div>')
  if (custom) out.push('<div class="hint">该插件是自定义函数写法，界面不改动它（请用「查看源码」编辑）。</div>')
  out.push('<div class="tags" data-tags="' + key + '" data-fk="tags-' + key + '" data-ph="输入后回车…"></div>')
  out.push('<div class="hint">' + esc(hint) + '</div>')
  out.push('</div>')
  return out.join('')
}

function askHtml(node, ro) {
  return '<div class="field-group">'
    + '<div class="field-group-head"><span>反问话术</span></div>'
    + '<div class="field"><div class="field-label">医生要问病人的原话（引擎反问时优先用它，留空则用中文标题）</div>'
    + '<input class="input" data-fk="ask" value="' + esc(node.ask || '') + '" placeholder="例如：你怕冷吗？"'
    + (ro ? ' disabled' : '') + '></div>'
    + '<div class="hint">改完按回车或点到别处生效。</div>'
    + '</div>'
}

// ------------------------------------------------------------
// 依赖条件编辑器
// ------------------------------------------------------------

function needsGroupHtml(node, ex, ro) {
  const paths = listOf(node.needs)
  const total = paths.reduce((a, p) => a + listOf(p).length, 0)
  const out = ['<div class="field-group">']
  out.push('<div class="field-group-head"><span>依赖条件</span>'
    + '<span class="hint">' + paths.length + ' 条路径 · ' + total + ' 个条件</span></div>')
  out.push('<div class="hint">路径内全部满足＝成立；任一路径被明确否定 → 整体不成立。多条路径 = OR。</div>')
  if (ex && ex.pathConflict) out.push(conflictNoteHtml(ex))
  if (S.sim) out.push('<div class="hint">下面的「当前状态 / 本条路径」来自上一次模拟（服务端读的是磁盘上的插件，未保存的改动不会立刻反映）。</div>')
  if (!paths.length) out.push('<div class="hint">这个节点目前没有任何依赖条件：引擎里它会保持「未知」，除非被直接设定（模拟面板可以强制设定）。</div>')
  paths.forEach((p, pi) => out.push(pathHtml(node, pi, listOf(p), ex)))
  out.push('<button class="btn btn-sm" data-act="addpath"' + (ro ? ' disabled' : '') + '>＋ 新增一条路径(OR)</button>')
  out.push('</div>')
  return out.join('')
}

function pathHtml(node, pi, conds, ex) {
  const exp = (ex && ex.paths) ? ex.paths[pi] : null
  const ro = node.editable === false
  const out = ['<div class="path-group" data-path="' + pi + '">']
  out.push('<div class="path-head">'
    + '<span class="path-idx">' + pathLabel(pi) + '</span>'
    + '<button class="btn btn-mini" data-act="addcond" data-path="' + pi + '"' + (ro ? ' disabled' : '') + '>＋ 加条件</button>'
    + '<span style="flex:1"></span>'
    + '<button class="btn btn-mini btn-mini-danger" data-act="delpath" data-path="' + pi + '"'
    + ((ro || listOf(node.needs).length < 2) ? ' disabled' : '') + ' title="至少保留一条路径，想清空请逐条删条件">删路径</button>'
    + '</div>')
  out.push('<div class="cond-list">')
  conds.forEach((c, ci) => out.push(condHtml(node, pi, ci, c, exp)))
  if (!conds.length) out.push('<div class="hint">这条路径还是空的（空路径在引擎里等于永真）。点「＋ 加条件」补上，或删掉这条路径。</div>')
  out.push('</div>')
  if (exp) out.push(pathStatusHtml(exp))
  out.push('</div>')
  return out.join('')
}

function condHtml(node, pi, ci, c, exp) {
  const ro = node.editable === false
  const target = S.nodes.get(c.ref)
  const title = target ? (target.title || target.name) : c.ref
  const missing = !target
  const ec = (exp && exp.conds && exp.conds[ci] && exp.conds[ci].ref === c.ref) ? exp.conds[ci] : null
  const pol = c.pol === 'no' ? 'no' : 'yes'
  const out = ['<div class="cond" data-path="' + pi + '" data-cond="' + ci + '">']
  out.push('<span class="cond-title"' + (missing ? ' style="color:var(--danger)"' : '')
    + ' title="' + esc(missing ? '节点不存在：' + c.ref : c.ref) + '">'
    + esc(title) + (missing ? '（节点不存在）' : '') + '</span>')
  out.push('<span class="pol ' + (pol === 'no' ? 'pol-no' : 'pol-yes') + '" data-act="pol" data-path="' + pi
    + '" data-cond="' + ci + '" role="button" style="cursor:pointer" title="点击切换极性（是 / 非）">'
    + (pol === 'no' ? '非' : '是') + '</span>')
  if (ec) out.push('<span class="muted nowrap" style="color:' + triColor(ec.state) + '" title="该条件引用的节点在当前模拟里的状态">当前：' + triLabel(ec.state) + (ec.ok ? '' : '（未满足）') + '</span>')
  out.push(moveSelectHtml(node, pi, ci))
  out.push('<button class="cond-x" data-act="delcond" data-path="' + pi + '" data-cond="' + ci + '" title="删除该条件"'
    + (ro ? ' disabled' : '') + '>×</button>')
  out.push('</div>')
  return out.join('')
}

function moveSelectHtml(node, pi, ci) {
  const paths = listOf(node.needs)
  const ro = node.editable === false
  if (paths.length < 2) {
    return '<select class="select select-mini" disabled title="只有一条路径，无法移动"><option>' + pathLabel(0) + '</option></select>'
  }
  const opts = paths.map((p, i) =>
    '<option value="' + i + '"' + (i === pi ? ' selected' : '') + '>' + pathLabel(i) + '</option>').join('')
  return '<select class="select select-mini" data-act="move" data-path="' + pi + '" data-cond="' + ci + '"'
    + ' title="把这条条件移动到另一条路径"' + (ro ? ' disabled' : '') + '>' + opts + '</select>'
}

/** 条件的中文描述：中文名 + 极性（非） */
function condLabel(c) {
  return (c.title || c.ref) + (c.want === 'no' ? '(非)' : '')
}

function pathStatusHtml(exp) {
  const conds = listOf(exp.conds)
  if (exp.status === 'ok') return '<div class="path-status path-ok">本条路径：全部满足 ✓</div>'
  if (exp.status === 'blocked') {
    // 把所有卡死本路径的条件都列出来（含极性），而不是只说「被阻断」
    const bad = conds.filter(c => !c.ok && !c.unknown).map(condLabel)
    return '<div class="path-status path-blocked">本条路径：被 ' + esc(bad.join('、') || '未知条件') + ' 阻断 ✗</div>'
  }
  // 待确认：直接写出还缺哪些症状，否则用户看不出是哪几个
  const miss = conds.filter(c => !c.ok).map(condLabel)
  if (!miss.length) return '<div class="path-status path-pending">本条路径：待确认</div>'
  return '<div class="path-status path-pending">本条路径：还缺 ' + esc(miss.join('、'))
    + ' 待确认（' + miss.length + ' 项）</div>'
}

/** 引擎判否但 OR 语义仍有路径 —— 必须醒目说明，否则界面会显得自相矛盾 */
function conflictNoteHtml(ex) {
  const paths = listOf(ex.paths)
  const blocked = paths.filter(p => p.status === 'blocked')
  const alive = paths.filter(p => p.status === 'pending' || p.status === 'ok')
  const blockedTxt = blocked.map(p => {
    const bad = listOf(p.conds).filter(c => !c.ok && !c.unknown).map(c => c.title || c.ref).join('、')
    return '第 ' + (p.index + 1) + ' 条路径已被「' + (bad || '未知条件') + '」明确阻断'
  }).join('；')
  const aliveTxt = alive.length
    ? '但按 OR 语义第 ' + alive.map(p => p.index + 1).join('、') + ' 条路径仍有希望'
    : '其余路径也没能走通'
  return '<div class="or-note">⚠ 路径冲突：引擎已判否（' + esc(blockedTxt) + '），' + esc(aliveTxt)
    + '。引擎的实现是「任一路径被明确阻断即判 no」，不是教科书的 OR 语义 —— 要消除冲突，需要调整路径划分或极性。</div>'
}

// ------------------------------------------------------------
// 反向引用（被谁依赖）
// ------------------------------------------------------------

function depGroupHtml(node) {
  const users = usersOf(node.name)
  const out = ['<div class="field-group">']
  out.push('<div class="field-group-head"><span>被谁依赖</span><span class="hint">' + users.length + ' 处引用</span></div>')
  if (!users.length) {
    out.push('<div class="hint">没有任何节点引用它（画布上是孤立节点）。</div>')
  } else {
    out.push('<ul class="dep-list">')
    const cap = users.slice(0, 60)
    cap.forEach(u => {
      const un = S.nodes.get(u.node)
      out.push('<li class="dep-item" data-goto="' + esc(u.node) + '" role="button" style="cursor:pointer" title="点击选中这个上游节点">')
      if (un) out.push('<span class="kind-tag kind-' + esc(un.kind) + '">' + esc(kindLabel(un.kind)) + '</span>')
      out.push('<span class="nowrap">' + esc(u.title || u.node) + '</span>')
      out.push('<code class="muted">' + esc(u.node) + '</code>')
      out.push('<span style="flex:1"></span>')
      out.push('<span class="muted nowrap">' + pathLabel(u.path) + '</span>')
      out.push('<span class="pol ' + (u.pol === 'no' ? 'pol-no' : 'pol-yes') + '">' + (u.pol === 'no' ? '非' : '是') + '</span>')
      out.push('</li>')
    })
    out.push('</ul>')
    if (users.length > cap.length) out.push('<div class="hint">只显示前 ' + cap.length + ' 处，共 ' + users.length + ' 处。</div>')
  }
  out.push('</div>')
  return out.join('')
}

// ------------------------------------------------------------
// 事件绑定：节点
// ------------------------------------------------------------

function bindNode(root, node) {
  const ro = node.editable === false

  // 中文标题：input 事件即时写入（update 内部已 emit，这里再自绘一次以免依赖 app.js）
  const titleEl = root.querySelector('[data-fk="title"]')
  if (titleEl && !ro) {
    titleEl.addEventListener('input', () => {
      update(node.name, { title: titleEl.value })
      draw()
    })
  }

  // 反问话术：change 时写入
  const askEl = root.querySelector('[data-fk="ask"]')
  if (askEl && !ro) {
    askEl.addEventListener('change', () => {
      update(node.name, { ask: askEl.value.trim() })
      draw()
    })
  }

  // 类型：改 kind 的同时把 isLeaf 一起同步（症状/脉象=输入层）
  const kindEl = root.querySelector('[data-fk="kind"]')
  if (kindEl && !ro) {
    kindEl.addEventListener('change', () => {
      const k = kindEl.value
      update(node.name, { kind: k, isLeaf: (k === 'symptom' || k === 'pulse') })
      toast('类型已改为「' + kindLabel(k) + '」；保存时服务端会把文件搬到 plugins/' + (S.dirs[k] || '') + '/ 下')
      draw()
    })
  }

  // 三个标签编辑器
  ;['trigger', 'negate', 'contraindications'].forEach(key => {
    const box = root.querySelector('[data-tags="' + key + '"]')
    if (box) mountTags(box, node, key, ro || !!(node.modes && node.modes[key] === 'custom'))
  })

  // 条目的动作按钮（下拉框走 change，不在这里处理）
  root.querySelectorAll('[data-act]').forEach(el => {
    if (el.tagName === 'SELECT') return
    el.addEventListener('click', () => onNodeAct(node, el.dataset.act, el))
  })
  root.querySelectorAll('select[data-act="move"]').forEach(el => {
    el.addEventListener('change', () => {
      const pi = Number(el.dataset.path)
      const ci = Number(el.dataset.cond)
      const to = Number(el.value)
      if (to === pi) return
      moveCondition(node.name, pi, ci, to)
      toast('条件已移动到' + pathLabel(to))
      draw()
    })
  })

  // 反向引用跳转
  root.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => devSelect(el.dataset.goto))
  })
}

function onNodeAct(node, act, el) {
  const pi = Number(el.dataset.path)
  const ci = Number(el.dataset.cond)
  if (act === 'rename') { doRename(node); return }
  if (act === 'delete') { doDelete(node); return }
  if (act === 'source') { doSource(node); return }
  if (act === 'addpath') { addPath(node.name); draw(); return }
  if (act === 'delpath') {
    if (listOf(node.needs).length < 2) { toast('至少要保留一条路径；想清空依赖请逐条删条件', 'warn'); return }
    removePath(node.name, pi)
    draw()
    return
  }
  if (act === 'addcond') { pickNode(node, pi); return }
  if (act === 'delcond') { removeCondition(node.name, pi, ci); draw(); return }
  if (act === 'pol') {
    const c = listOf(node.needs[pi])[ci]
    if (!c) return
    setPolarity(node.name, pi, ci, c.pol === 'no' ? 'yes' : 'no')
    draw()
  }
}

/** 标签编辑器：回车添加、点 × 删除、输入框为空按退格删最后一个 */
function mountTags(box, node, key, locked) {
  const items = () => listOf(node[key])
  const setItems = arr => update(node.name, { [key]: arr })
  const ph = box.getAttribute('data-ph') || '输入后回车…'

  const paint = () => {
    const arr = items()
    box.innerHTML = arr.map((w, i) =>
      '<span class="tag">' + esc(w) + '<button class="tag-x" data-i="' + i + '" title="删除">×</button></span>').join('')
      + (locked ? '' : '<input class="tag-input" data-fk="tags-' + key + '" placeholder="' + esc(ph) + '">')
    const cnt = box.parentElement ? box.parentElement.querySelector('[data-count="' + key + '"]') : null
    if (cnt) cnt.textContent = arr.length + ' 个'
    if (locked) box.style.cursor = 'default'
  }

  const focusInput = () => {
    const i = box.querySelector('.tag-input')
    if (i && box.isConnected !== false) i.focus()
  }

  box.addEventListener('click', ev => {
    if (locked) return
    const x = ev.target.closest ? ev.target.closest('.tag-x') : null
    if (x) {
      const i = Number(x.dataset.i)
      const arr = items().slice()
      const gone = arr.splice(i, 1)[0]
      setItems(arr)
      paint()
      if (box.isConnected !== false) toast('已删除「' + gone + '」')
      return
    }
    focusInput()   // 点空白处也能开始输入
  })

  box.addEventListener('keydown', ev => {
    if (locked) return
    const input = ev.target
    if (!input || !input.classList || !input.classList.contains('tag-input')) return
    if (ev.key === 'Enter') {
      ev.preventDefault()
      const v = String(input.value || '').trim()
      if (!v) return
      if (items().indexOf(v) >= 0) { toast('「' + v + '」已经在列表里了', 'warn'); return }
      const arr = items().slice()
      arr.push(v)
      setItems(arr)
      paint()
      focusInput()
      return
    }
    if (ev.key === 'Backspace' && input.value === '') {
      const arr = items()
      if (!arr.length) return
      const last = arr[arr.length - 1]
      setItems(arr.slice(0, -1))
      paint()
      if (box.isConnected !== false) toast('已删除「' + last + '」')
    }
  })

  paint()
}

// ------------------------------------------------------------
// 动作：重命名 / 删除 / 查看源码 / 选节点
// ------------------------------------------------------------

async function doRename(node) {
  const from = node.name
  const to = await promptDialog({
    title: '重命名节点',
    label: '新 name（小写字母开头，只能用小写字母 / 数字 / 下划线）',
    value: from,
    okLabel: '重命名',
    validate: v => {
      if (!v) return '不能为空'
      if (!/^[a-z][a-z0-9_]*$/.test(v)) return '只能用小写字母、数字、下划线，且必须以字母开头'
      if (v === from) return '与原名字相同'
      if (S.nodes.has(v)) return '已存在同名节点：' + v
      return null
    }
  })
  if (!to) return
  const refs = usersOf(from).length
  const ok = renameNode(from, to)
  if (!ok) { toast('重命名失败：目标名字已被占用', 'err'); return }
  toast('已重命名为 ' + to + (refs ? '（' + refs + ' 处引用会在保存时同步改写）' : ''))
  draw()
}

async function doDelete(node) {
  const users = usersOf(node.name)
  const lines = users.slice(0, 10).map(u =>
    '<li>' + esc(u.title || u.node) + '（<code>' + esc(u.node) + '</code>）的 ' + pathLabel(u.path) + ' · '
    + (u.pol === 'no' ? '非' : '是') + '</li>').join('')
  const msg = '<div>将删除节点「<b>' + esc(node.title || node.name) + '</b>」（<code>' + esc(node.name) + '</code>）。</div>'
    + (users.length
      ? '<div style="margin-top:8px">它被 <b>' + users.length + '</b> 处引用，这些引用会连带移除（服务端会同步改写这些文件的 needs）：</div>'
        + '<ul style="margin:6px 0 0 18px;padding:0;font-size:12px;line-height:1.7">' + lines + '</ul>'
        + (users.length > 10 ? '<div class="hint" style="margin-top:6px">…等共 ' + users.length + ' 处</div>' : '')
      : '<div style="margin-top:8px">当前没有任何节点引用它。</div>')
    + '<div class="hint" style="margin-top:8px">（这一步只改前端模型，真正落盘要保存；保存前可以 Ctrl+Z 撤销）</div>'
  const ok = await confirmDialog({ title: '删除节点', message: msg, okLabel: '删除', kind: 'danger' })
  if (!ok) return
  deleteNode(node.name)
  toast('已删除 ' + node.name + '（未保存，可撤销）')
  draw()
}

async function doSource(node) {
  try {
    const r = await getSource(node.name)
    if (!r || r.ok === false) { toast((r && r.error) || '读取源码失败', 'err'); return }
    showSourceDialog((node.title || node.name) + ' · ' + (r.file || node.name), r.source)
  } catch (e) {
    toast('读取源码失败：' + e.message, 'err')
  }
}

/** 弹出一个可搜索的节点选择列表，选中后作为条件加到指定路径 */
function pickNode(target, pathIndex) {
  const m = openModal({
    title: '选择被依赖的节点',
    width: 'min(620px,92vw)',
    body: '<div class="modal-note">给「' + esc(target.title || target.name) + '」的' + pathLabel(pathIndex)
      + '加一个条件：路径内的条件是与(AND)，多条路径之间是或(OR)。</div>'
      + '<input class="input" data-fk="pick" placeholder="搜索中文名 / name / 触发词…">'
      + '<div class="sim-list" data-pick-list></div>',
    buttons: [{ label: '取消', onClick: c => c() }]
  })
  const listEl = m.body.querySelector('[data-pick-list]')
  const inputEl = m.body.querySelector('[data-fk="pick"]')

  const paint = q => {
    const kw = String(q || '').trim().toLowerCase()
    const rows = S.order.map(n => S.nodes.get(n)).filter(Boolean).filter(n => {
      if (!kw) return true
      if (n.name.toLowerCase().indexOf(kw) >= 0) return true
      if (String(n.title || '').toLowerCase().indexOf(kw) >= 0) return true
      return listOf(n.trigger).some(t => String(t).toLowerCase().indexOf(kw) >= 0)
    }).slice(0, 200)
    listEl.innerHTML = rows.length
      ? rows.map(n => '<div class="sim-row" data-pick="' + esc(n.name) + '" role="button" style="cursor:pointer">'
        + '<span class="kind-tag kind-' + esc(n.kind) + '">' + esc(kindLabel(n.kind)) + '</span>'
        + '<span class="sim-title">' + esc(n.title || n.name) + ' <span class="muted mono">' + esc(n.name) + '</span></span>'
        + (n.name === target.name ? '<span class="mini-badge warn">自身</span>' : '')
        + '</div>').join('')
      : '<div class="result-empty">没有匹配的节点。</div>'
  }
  paint('')

  inputEl.addEventListener('input', () => paint(inputEl.value))
  listEl.addEventListener('click', ev => {
    const row = ev.target.closest ? ev.target.closest('[data-pick]') : null
    if (!row) return
    const ref = row.dataset.pick
    addCondition(target.name, ref, 'yes', pathIndex)
    m.close()
    draw()
    const tn = S.nodes.get(ref)
    toast('已加入条件：' + (tn ? tn.title : ref) + '（默认「是」，点极性可切成「非」）')
  })
  setTimeout(() => { try { inputEl.focus() } catch (_) {} }, 30)
}

// ------------------------------------------------------------
// 连线视图
// ------------------------------------------------------------

function edgeHtml(edge) {
  const from = S.nodes.get(edge.from)
  const to = S.nodes.get(edge.to)
  const row = from ? listOf(from.needs)[edge.path] : null
  const cond = row ? row[edge.cond] : null
  if (!from || !cond) {
    return '<div class="insp"><div class="warn">这条连线已经失效（源节点或条件不存在了）。</div>'
      + '<div class="insp-actions"><button class="btn btn-sm" data-act="back">返回节点检视</button></div></div>'
  }
  const pol = cond.pol === 'no' ? 'no' : 'yes'
  const fromTitle = from.title || from.name
  const toTitle = to ? (to.title || to.name) : edge.to
  const out = ['<div class="insp">']
  out.push('<div class="insp-head">'
    + '<span class="kind-tag kind-' + esc(from.kind) + '">' + esc(kindLabel(from.kind)) + '</span>'
    + '<h3 class="insp-title">' + esc(fromTitle) + ' → ' + esc(toTitle) + '</h3>'
    + '<code class="insp-name">' + esc(edge.from) + ' → ' + esc(edge.to) + '</code></div>')
  out.push('<div class="field-group">'
    + '<div class="field-group-head"><span>连线语义</span><span class="hint">' + pathLabel(edge.path) + ' · 第 ' + (edge.cond + 1) + ' 个条件</span></div>'
    + '<div class="field"><div class="field-label">源节点（提出依赖的一方）</div>'
    + '<div>' + esc(fromTitle) + ' <code class="muted mono">' + esc(from.name) + '</code></div></div>'
    + '<div class="field"><div class="field-label">目标节点（被依赖的一方）</div>'
    + '<div>' + esc(toTitle) + ' <code class="muted mono">' + esc(edge.to) + '</code>'
    + (to ? '' : ' <span class="muted" style="color:var(--danger)">（节点不存在）</span>') + '</div></div>'
    + '<div class="field"><div class="field-label">极性</div>'
    + '<div><span class="pol ' + (pol === 'no' ? 'pol-no' : 'pol-yes') + '">' + (pol === 'no' ? '非' : '是') + '</span>'
    + ' <span class="hint">' + (pol === 'no' ? '要求目标节点「没有」' : '要求目标节点「有」') + '</span></div></div>'
    + '<div class="hint">同一条路径内的条件是与(AND)：全部满足该节点才成立。</div>'
    + '</div>')
  out.push('<div class="insp-actions">'
    + '<button class="btn btn-sm" data-act="flip">切换极性</button>'
    + '<button class="btn btn-sm btn-danger" data-act="del">删除该条件</button>'
    + '<button class="btn btn-sm btn-ghost" data-act="sel">选中源节点</button>'
    + '</div>')
  out.push('</div>')
  return out.join('')
}

function bindEdge(root, edge) {
  const from = S.nodes.get(edge.from)
  const cond = from ? listOf(from.needs)[edge.path] && listOf(from.needs)[edge.path][edge.cond] : null
  root.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', () => {
      const act = el.dataset.act
      if (act === 'back') { mode = 'node'; edgeRef = null; draw(); return }
      if (!from || !cond) return
      if (act === 'flip') {
        const next = cond.pol === 'no' ? 'yes' : 'no'
        setPolarity(edge.from, edge.path, edge.cond, next)
        toast('极性已切换为「' + (next === 'no' ? '非' : '是') + '」')
        draw()
        return
      }
      if (act === 'del') {
        removeCondition(edge.from, edge.path, edge.cond)
        mode = 'node'
        edgeRef = null
        toast('已删除该条件')
        draw()
        return
      }
      if (act === 'sel') devSelect(edge.from)
    })
  })
}
