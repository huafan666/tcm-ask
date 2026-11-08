// dev/public/js/app.js
// 开发端主控：装配画布 / 面板 / 工具栏 / 保存流程 / 快捷键

import {
  S, loadGraph, on, emit, allNodes, node, dirtyNames, buildPayload,
  undo, redo, renameNode, deleteNode, usersOf, update, recomputeDirty, addNode, addCondition
} from './store.js'
import * as api from './api.js'
import { initCanvas, render, fitView, zoomBy, relayoutAll, centerOn, hooks } from './canvas.js'
import * as inspector from './inspector.js'
import * as panels from './panels.js'
import { toast, openModal, confirmDialog, promptDialog, showSourceDialog, esc, el } from './ui.js'
import { autoLayout, nodeSize } from './layout.js'

const KIND_LABEL = { symptom: '症状', pulse: '脉象', summary: '证候', formula: '方剂' }
const KIND_ORDER = ['symptom', 'pulse', 'summary', 'formula']
let activeTab = 'inspect'

// ------------------------------------------------------------
// 启动
// ------------------------------------------------------------

async function boot() {
  initCanvas()
  wireHooks()
  wireToolbar()
  wireTabs()
  wireKeys()
  wireList()
  window.__devSelect = name => selectNode(name, { center: true })

  // store 事件 → 界面刷新
  on('model-changed', () => {
    render()
    renderList()
    renderTotals()
    refreshRight()
  })
  on('dirty', n => {
    const b = document.getElementById('dirty-count')
    if (b) { b.textContent = n; b.style.color = n ? '#fbbf24' : '' }
    const btn = document.getElementById('btn-save')
    if (btn) btn.classList.toggle('btn-primary', n > 0)
  })
  on('sim-updated', () => {
    render()
    if (activeTab === 'sim') renderRightPanel()
  })
  on('layout-changed', () => {})

  await reload()
  pollStatus()
  setInterval(pollStatus, 5000)
}

async function reload() {
  try {
    const data = await api.getGraph()
    loadGraph(data)
    const missing = allNodes().filter(n => !S.layout.nodes[n.name])
    if (missing.length) {
      const res = autoLayout(allNodes(), S.layout.nodes, { force: false })
      S.layout.nodes = res.nodes
    }
    if (data.layout && data.layout.viewport) {
      S.view = { x: data.layout.viewport.x || 60, y: data.layout.viewport.y || 60, k: data.layout.viewport.k || 1 }
    }
    renderList()
    renderTotals()
    render()
    refreshRight()
    setStatus(`已载入 ${allNodes().length} 个插件`)
    setTimeout(() => fitView(false), 60)
  } catch (e) {
    toast(e.message, 'err')
  }
}

// ------------------------------------------------------------
// 画布回调
// ------------------------------------------------------------

function wireHooks() {
  hooks.onSelect = names => {
    renderList()
    refreshRight()
    const sel = document.getElementById('status-sel')
    if (sel) {
      sel.textContent = names.length === 0 ? '' : (names.length === 1
        ? `选中：${node(names[0]) ? node(names[0]).title : names[0]}`
        : `选中 ${names.length} 个节点`)
    }
    if (S.focus) render()
  }

  // ------------------------------------------------------------
  // 就地建节点（Blender 式）：双击空白 / 连线拖到空白
  // ------------------------------------------------------------
  const KIND_MENU = [
    { kind: 'symptom', label: '症状', color: '#38bdf8', dir: 'symptoms' },
    { kind: 'pulse', label: '脉象', color: '#a78bfa', dir: 'pulses' },
    { kind: 'summary', label: '证候', color: '#fbbf24', dir: 'syndromes' },
    { kind: 'formula', label: '方剂', color: '#34d399', dir: 'formulas' }
  ]
  const KIND_TITLE = { symptom: '新症状', pulse: '新脉象', summary: '新证候', formula: '新方剂' }

  function uniqueName(kind) {
    const base = 'new_' + kind
    if (!node(base)) return base
    for (let i = 2; i < 999; i++) { if (!node(base + '_' + i)) return base + '_' + i }
    return base + '_' + Date.now().toString(36)
  }

  /** 在画布坐标 world 处建一个空节点，选中它并把光标放进「中文标题」输入框 */
  function createNodeAt(kind, world) {
    const name = uniqueName(kind)
    const spec = { name, title: KIND_TITLE[kind] || '新节点', kind }
    const n = addNode(spec)
    S.layout.nodes[name] = { x: world.x, y: world.y }
    S.layoutDirty = true
    S.sel = new Set([name])
    render(); renderList(); refreshRight()
    const input = document.querySelector('#tab-inspect input[data-fk="title"]')
    if (input) { input.focus(); input.select() }
    toast('已建「' + n.title + '」，直接改名字 / 加关键词，保存时才会入库', 'ok', 6000)
    return n
  }

  /** 光标处弹出四种节点类型的小菜单 */
  function showKindPicker(clientX, clientY, onPick) {
    const old = document.querySelector('#kind-picker')
    if (old) old.remove()
    const menu = document.createElement('div')
    menu.id = 'kind-picker'
    menu.style.cssText = 'position:fixed;z-index:120;background:#151b23;border:1px solid rgba(255,255,255,.14);'
      + 'border-radius:9px;box-shadow:0 12px 30px rgba(0,0,0,.5);padding:5px;display:grid;gap:2px;min-width:112px;'
      + 'font-family:inherit'
    menu.innerHTML = KIND_MENU.map(k =>
      '<button data-kind="' + k.kind + '" style="display:flex;align-items:center;gap:7px;padding:6px 10px;'
      + 'border:0;background:none;color:#e6edf5;font-size:12.5px;text-align:left;border-radius:6px;cursor:pointer">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + k.color + '"></span>' + k.label + '</button>'
    ).join('')
    const x = Math.min(clientX, window.innerWidth - 130)
    const y = Math.min(clientY, window.innerHeight - 170)
    menu.style.left = x + 'px'
    menu.style.top = y + 'px'
    document.body.appendChild(menu)
    const close = () => { menu.remove(); document.removeEventListener('mousedown', outside, true) }
    const outside = e => { if (!menu.contains(e.target)) close() }
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0)
    menu.querySelectorAll('[data-kind]').forEach(btn => {
      btn.onmouseenter = () => { btn.style.background = 'rgba(20,184,166,.14)' }
      btn.onmouseleave = () => { btn.style.background = 'none' }
      btn.onclick = () => { const k = btn.dataset.kind; close(); onPick(k) }
    })
  }

  // 双击空白处 → 选类型 → 就地建节点
  hooks.onCreateAt = (world, clientX, clientY) => {
    showKindPicker(clientX, clientY, kind => createNodeAt(kind, world))
  }

  // 从节点的输出圆点拖到空白处松开 → 按分层推断类型，就地新建并自动连上
  hooks.onLinkEmptyDrop = (from, world, pol, clientX, clientY) => {
    const src = node(from)
    if (!src) return
    const guess = (src.kind === 'symptom' || src.kind === 'pulse') ? 'summary'
      : (src.kind === 'summary' ? 'formula' : null)
    const finish = kind => {
      const n = createNodeAt(kind, world)
      const paths = n.needs.length || 1
      addCondition(n.name, from, pol, paths - 1)
      S.sel = new Set([n.name])
      render(); renderList(); refreshRight()
      toast('已新建「' + n.title + '」并连上：' + (src.title || from) + (pol === 'no' ? '（非）' : '') + ' → ' + n.title, 'ok', 7000)
    }
    if (guess) finish(guess)
    else showKindPicker(clientX || window.innerWidth / 2, clientY || window.innerHeight / 2, finish)
  }

  hooks.onLinkDrop = (from, to, pol) => {
    const t = node(to)
    if (!t) return
    const f = node(from)
    if (from === to) { toast('不能把节点连到自己', 'warn'); return }
    const paths = t.needs.length || 1
    openModal({
      title: '新增依赖条件',
      width: 'min(560px,92vw)',
      body: `<div class="modal-note">
        把「<b>${esc(f ? f.title : from)}</b>」加入「<b>${esc(t.title)}</b>」的依赖条件。
        <br>含义：<b>是</b> = 必须有这个症状；<b>非</b> = 必须没有（用来排除）。
        <br>路径：同一路径内的条件必须<b>全部满足</b>；多条路径之间是 <b>或</b> 的关系。
      </div>
      <div class="form-row"><div class="form-label">极性</div>
        <div class="radio-row">
          <label><input type="radio" name="lp" value="yes" ${pol === 'yes' ? 'checked' : ''}> 是（必须有）</label>
          <label><input type="radio" name="lp" value="no" ${pol === 'no' ? 'checked' : ''}> 非（必须没有）</label>
        </div></div>
      <div class="form-row"><div class="form-label">加入哪条路径</div>
        <select class="select" id="lp-path">
          ${Array.from({ length: paths }, (_, i) => `<option value="${i}">路径 ${i + 1}（现有 ${t.needs[i] ? t.needs[i].length : 0} 个条件）</option>`).join('')}
          <option value="new">＋ 新建一条路径（OR）</option>
        </select></div>`,
      buttons: [
        { label: '取消', onClick: c => c() },
        {
          label: '添加', kind: 'primary', onClick: (c, body) => {
            const p = body.querySelector('input[name=lp]:checked').value
            const pv = body.querySelector('#lp-path').value
            if (pv === 'new') addCond(to, from, p, node(to).needs.length)
            else addCond(to, from, p, Number(pv))
            c()
          }
        }
      ]
    })
  }

  hooks.onContext = (name, x, y) => showContextMenu(name, x, y)
  hooks.onEdgeSelect = edge => {
    activeTab = 'inspect'
    setTab('inspect')
    if (inspector.renderEdgeInspector) inspector.renderEdgeInspector(document.getElementById('tab-inspect'), edge)
  }
}

function addCond(target, ref, pol, pathIndex) {
  const t = node(target)
  if (!t) return
  if (t.needs.some(p => p.some(c => c.ref === ref))) { toast('该节点已经引用了这个条件', 'warn'); return }
  addCondition(target, ref, pol, pathIndex)
  toast(`已添加条件：${node(ref) ? node(ref).title : ref} ${pol === 'no' ? '（非）' : '（是）'}`, 'ok')
}

// ------------------------------------------------------------
// 工具栏
// ------------------------------------------------------------

function wireToolbar() {
  const $ = id => document.getElementById(id)

  $('btn-reload').addEventListener('click', async () => {
    if (dirtyNames().length) {
      const ok = await confirmDialog({
        title: '放弃未保存的改动？',
        message: `当前有 <b>${dirtyNames().length}</b> 个节点已被修改但还没写回磁盘。<br>「重新载入」会丢弃这些改动，从磁盘重新读取。`,
        okLabel: '丢弃并重新载入', kind: 'danger'
      })
      if (!ok) return
    }
    await reload()
    toast('已从磁盘重新载入', 'ok')
  })

  $('btn-new').addEventListener('click', showNewNodeDialog)
  $('btn-layout-all').addEventListener('click', () => {
    const ok = confirmDialog({
      title: '重新自动布局',
      message: '按「症状 → 证候 → 方剂」分层重排全部节点，你手动摆好的位置会被覆盖（保存后才会写入磁盘）。',
      okLabel: '重新布局'
    }).then(v => {
      if (!v) return
      const res = autoLayout(allNodes(), {}, { force: true })
      S.layout.nodes = res.nodes
      S.layoutDirty = true
      render()
      setTimeout(() => fitView(false), 40)
      toast('已重新布局，记得保存', 'ok')
    })
  })
  $('btn-save').addEventListener('click', doSave)

  $('btn-zoom-in').addEventListener('click', () => zoomBy(1.15))
  $('btn-zoom-out').addEventListener('click', () => zoomBy(1 / 1.15))
  $('btn-fit').addEventListener('click', () => fitView(S.focus))

  $('chk-focus').addEventListener('change', e => { S.focus = e.target.checked; render() })
  $('focus-depth').addEventListener('change', e => { S.focusDepth = Math.max(1, Math.min(6, Number(e.target.value) || 2)); render() })
  $('chk-sim').addEventListener('change', e => { S.simColor = e.target.checked; render() })
  $('chk-edges').addEventListener('change', e => {
    S.showEdges = e.target.checked
    const g = document.getElementById('layer-edges')
    if (g) g.style.display = S.showEdges ? '' : 'none'
  })
  $('chk-arrows').addEventListener('change', e => { S.showArrows = e.target.checked; render() })
  $('chk-only-issues').addEventListener('change', e => { S.onlyIssues = e.target.checked; render() })
}

function renderTotals() {
  const st = S.stats || {}
  const d = dirtyNames().length
  const host = document.getElementById('topstats')
  if (!host) return
  host.innerHTML = `
    <span class="mono">共 ${st.total || 0}</span>
    <span class="mono">症状 ${(st.byKind && st.byKind.symptom) || 0}</span>
    <span class="mono">脉象 ${(st.byKind && st.byKind.pulse) || 0}</span>
    <span class="mono">证候 ${(st.byKind && st.byKind.summary) || 0}</span>
    <span class="mono">方剂 ${(st.byKind && st.byKind.formula) || 0}</span>
    <span class="mono">引用 ${st.refs || 0}</span>
    <span class="mono">OR ${st.orNodes || 0}</span>
    ${(st.dangling && st.dangling.length) ? `<span class="mono" style="color:#f87171">悬空 ${st.dangling.length}</span>` : ''}
    ${(st.orphans && st.orphans.length) ? `<span class="mono" style="color:#fbbf24">未被引用 ${st.orphans.length}</span>` : ''}
    ${d ? `<span class="mono" style="color:#fbbf24">已改动 ${d}</span>` : ''}`
}

async function pollStatus() {
  const p = document.getElementById('main-status')
  if (!p) return
  try {
    const s = await api.getStatus()
    if (s.main && s.main.running) {
      p.className = 'pill pill-ok'
      p.textContent = `主服务运行中（${s.main.plugins || '?'} 插件）`
      p.title = '保存后会自动通知它热重载插件'
    } else {
      p.className = 'pill pill-off'
      p.textContent = '主服务未运行'
      p.title = '启动 dist\\启动中医辨证.bat 或 node server.js 后，保存仍会自动热重载'
    }
  } catch (e) {
    p.className = 'pill pill-off'
    p.textContent = '状态未知'
  }
}

// ------------------------------------------------------------
// 节点清单
// ------------------------------------------------------------

function wireList() {
  const search = document.getElementById('search')
  search.addEventListener('input', () => {
    S.search = search.value.trim()
    renderList()
    render()
  })
}

function renderKindFilters() {
  const host = document.getElementById('kind-filters')
  if (!host) return
  const st = S.stats || {}
  host.innerHTML = KIND_ORDER.map(k => `
    <button class="seg ${S.kindFilter.has(k) ? 'active' : ''}" data-kind="${k}">
      ${KIND_LABEL[k]} <span class="seg-n">${(st.byKind && st.byKind[k]) || 0}</span>
    </button>`).join('')
  host.querySelectorAll('.seg').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.kind
    if (S.kindFilter.has(k)) S.kindFilter.delete(k); else S.kindFilter.add(k)
    renderKindFilters()
    renderList()
    render()
  }))
}

function renderList() {
  renderKindFilters()
  const host = document.getElementById('node-list')
  if (!host) return
  const q = S.search.toLowerCase()
  const items = allNodes().filter(n => {
    if (S.kindFilter.size && !S.kindFilter.has(n.kind)) return false
    if (!q) return true
    return (n.title || '').toLowerCase().includes(q) || n.name.includes(q) ||
      (n.trigger || []).some(k => k.toLowerCase().includes(q))
  })

  host.innerHTML = items.map(n => {
    const badges = []
    if (n.needs.length > 1) badges.push(n.needs.length + '路径')
    else if (n.needs.length === 1) badges.push(n.needs[0].length + '条件')
    if (n.trigger && n.trigger.length) badges.push(n.trigger.length + '词')
    const dirty = n.created ? '新建' : (n.renamedFrom ? '改名' : '')
    return `<div class="node-item kind-${n.kind} ${S.sel.has(n.name) ? 'active' : ''}" data-name="${esc(n.name)}">
      <span class="dot"></span>
      <span class="ni-title">${esc(n.title)}</span>
      <span class="ni-name">${esc(n.name)}</span>
      <span class="ni-badges">
        ${dirty ? `<span class="mini-badge">${dirty}</span>` : ''}
        ${badges.slice(0, 2).map(b => `<span class="mini-badge">${esc(b)}</span>`).join('')}
      </span>
    </div>`
  }).join('')

  host.querySelectorAll('.node-item').forEach(it => it.addEventListener('click', () => {
    selectNode(it.dataset.name, { center: true })
  }))

  const lc = document.getElementById('list-count')
  if (lc) lc.textContent = items.length + ' / ' + allNodes().length
}

function selectNode(name, opts) {
  if (!node(name)) return
  S.sel = new Set([name])
  S.selEdge = null
  if (opts && opts.center) centerOn(name)
  if (opts && opts.focus && !S.focus) {
    S.focus = true
    const c = document.getElementById('chk-focus')
    if (c) c.checked = true
  }
  setTab('inspect')
  render()
  renderList()
  refreshRight()
}

// ------------------------------------------------------------
// 右侧面板
// ------------------------------------------------------------

function wireTabs() {
  document.querySelectorAll('#tabs .tab').forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)))
}

function setTab(name) {
  activeTab = name
  document.querySelectorAll('#tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name))
  document.querySelectorAll('.tab-body').forEach(b => b.classList.toggle('hidden', b.id !== 'tab-' + name))
  renderRightPanel()
}

function renderRightPanel() {
  const c = document.getElementById('tab-' + activeTab)
  if (!c) return
  if (activeTab === 'inspect' && inspector.renderInspector) inspector.renderInspector(c)
  if (activeTab === 'sim' && panels.renderSimPanel) panels.renderSimPanel(c)
  if (activeTab === 'chain' && panels.renderChainPanel) panels.renderChainPanel(c)
  if (activeTab === 'walk' && panels.renderWalkPanel) panels.renderWalkPanel(c)
}

/** 数据变化后只刷新「检视器」；模拟面板保留用户勾选状态 */
function refreshRight() {
  if (activeTab === 'inspect') renderRightPanel()
}

// ------------------------------------------------------------
// 快捷键
// ------------------------------------------------------------

function wireKeys() {
  window.addEventListener('keydown', async e => {
    const typing = /^(input|textarea|select)$/i.test((e.target.tagName || '')) || e.target.isContentEditable
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) { if (redo()) toast('已重做', 'ok') } else if (undo()) toast('已撤销', 'ok')
      render(); renderList(); refreshRight()
      return
    }
    if (typing) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (S.sel.size) { e.preventDefault(); await deleteSelected() }
      return
    }
    if (e.key.toLowerCase() === 'f') { fitView(S.focus); return }
    if (e.key === 'Escape') {
      S.sel = new Set(); S.selEdge = null; render(); renderList(); refreshRight()
    }
  })
}

async function deleteSelected() {
  const names = [...S.sel].filter(n => node(n))
  if (!names.length) return
  const lines = names.map(n => {
    const u = usersOf(n)
    return `${node(n).title}（${n}）${u.length ? ` —— 被 ${u.length} 处引用：${u.slice(0, 4).map(x => node(x.node).title).join('、')}${u.length > 4 ? '…' : ''}` : ' —— 没有节点引用它'}`
  }).join('<br>')
  const ok = await confirmDialog({
    title: `删除 ${names.length} 个节点`,
    message: `${lines}<br><br>删除会移除对应插件文件，并<b>连带</b>从引用它的方剂/证候里移除相关条件（服务端同步改写，且有 diff 预览与备份）。`,
    okLabel: '删除', kind: 'danger'
  })
  if (!ok) return
  for (const n of names) deleteNode(n)
  toast(`已删除 ${names.length} 个节点（保存后才写回磁盘）`, 'ok')
  render(); renderList(); refreshRight()
}

// ------------------------------------------------------------
// 右键菜单
// ------------------------------------------------------------

function showContextMenu(name, x, y) {
  const n = node(name)
  if (!n) return
  const host = document.getElementById('ctxmenu')
  const simv = S.simInput[name]
  host.innerHTML = `
    <div class="ctxitem" data-act="select">选中并居中</div>
    <div class="ctxitem" data-act="focus">以此为中心聚焦（${S.focusDepth} 跳）</div>
    <div class="ctxsep"></div>
    ${n.isLeaf ? `
      <div class="ctxitem" data-act="sim-yes">模拟中设为「有」${simv === 'yes' ? ' ✓' : ''}</div>
      <div class="ctxitem" data-act="sim-no">模拟中设为「没有」${simv === 'no' ? ' ✓' : ''}</div>
      <div class="ctxitem" data-act="sim-clear">模拟中设为「未知」</div>
      <div class="ctxsep"></div>` : ''}
    <div class="ctxitem" data-act="chain">看它的条文依赖树</div>
    <div class="ctxitem" data-act="users">看谁依赖它（${usersOf(name).length}）</div>
    <div class="ctxsep"></div>
    <div class="ctxitem" data-act="rename">重命名…</div>
    <div class="ctxitem" data-act="source">查看源码</div>
    <div class="ctxitem" data-act="copy">复制 name</div>
    <div class="ctxsep"></div>
    <div class="ctxitem" data-act="delete" style="color:#f87171">删除该节点…</div>`
  host.style.left = Math.min(x, window.innerWidth - 200) + 'px'
  host.style.top = Math.min(y, window.innerHeight - 260) + 'px'
  host.classList.remove('hidden')

  const close = () => host.classList.add('hidden')
  const onDoc = ev => { if (!host.contains(ev.target)) { close(); document.removeEventListener('mousedown', onDoc) } }
  setTimeout(() => document.addEventListener('mousedown', onDoc), 0)

  host.querySelectorAll('.ctxitem').forEach(it => it.addEventListener('click', async () => {
    const act = it.dataset.act
    close()
    if (act === 'select') selectNode(name, { center: true })
    if (act === 'focus') { S.focus = true; const c = document.getElementById('chk-focus'); if (c) c.checked = true; S.sel = new Set([name]); render() }
    if (act === 'sim-yes' || act === 'sim-no' || act === 'sim-clear') {
      if (act === 'sim-clear') delete S.simInput[name]
      else S.simInput[name] = act === 'sim-yes' ? 'yes' : 'no'
      await runSim()
    }
    if (act === 'chain') { S.sel = new Set([name]); setTab('chain') }
    if (act === 'users') { S.sel = new Set([name]); setTab('inspect') }
    if (act === 'rename') doRename(name)
    if (act === 'source') doShowSource(name)
    if (act === 'copy') { navigator.clipboard.writeText(name); toast('已复制 ' + name, 'ok') }
    if (act === 'delete') { S.sel = new Set([name]); deleteSelected() }
  }))
}

async function runSim() {
  try {
    S.sim = await api.postSimulate(S.simInput)
    emit('sim-updated')
  } catch (e) {
    toast('模拟失败：' + e.message, 'err')
  }
}

async function doRename(name) {
  const to = await promptDialog({
    title: '重命名节点',
    label: `把 ${name} 改成（只允许小写字母/数字/下划线）`,
    value: name,
    validate: v => {
      if (!/^[a-z][a-z0-9_]*$/.test(v)) return '格式不合法：小写字母开头，只能含小写字母、数字、下划线'
      if (v !== name && node(v)) return '已有同名节点'
      return null
    }
  })
  if (!to || to === name) return
  const users = usersOf(name)
  if (users.length) {
    const ok = await confirmDialog({
      title: '改名会影响引用',
      message: `有 <b>${users.length}</b> 处引用了 <b>${name}</b>（${users.slice(0, 6).map(u => node(u.node).title).join('、')}${users.length > 6 ? '…' : ''}）。<br>保存时服务端会把这些引用<b>只替换字符串</b>（注释与排版会保留），同时文件会改名为 <code>${to}.js</code>。`,
      okLabel: '继续改名'
    })
    if (!ok) return
  }
  renameNode(name, to)
  toast(`已改名：${name} → ${to}`, 'ok')
  centerOn(to)
  render(); renderList(); refreshRight()
}

async function doShowSource(name) {
  try {
    const r = await api.getSource(name)
    if (!r.ok) { toast(r.error || '读取失败', 'err'); return }
    showSourceDialog(r.file + '　（' + name + '）', r.source)
  } catch (e) { toast(e.message, 'err') }
}

// ------------------------------------------------------------
// 新建节点
// ------------------------------------------------------------

function showNewNodeDialog() {
  openModal({
    title: '新建节点',
    width: 'min(680px,94vw)',
    body: `<div class="modal-note">
      新建的是<b>插件文件</b>：保存时会写入 <code>plugins/&lt;目录&gt;/&lt;name&gt;.js</code>。
      输入层节点（症状/脉象）靠「触发关键词」被病人描述激活；推论层节点（证候/方剂）靠「依赖条件」成立。
    </div>
    <div class="form-row"><div class="form-label">类型</div>
      <select class="select" id="nn-kind">
        <option value="symptom">症状（输入层，病人能直接说出来的）</option>
        <option value="pulse">脉象（输入层，靠切诊/反问确认）</option>
        <option value="summary">证候（推论层）</option>
        <option value="formula">方剂（推论层）</option>
      </select></div>
    <div class="form-row-2">
      <div class="form-row"><div class="form-label">name（英文唯一标识）</div>
        <input class="input" id="nn-name" placeholder="如 severe_headache"></div>
      <div class="form-row"><div class="form-label">中文标题</div>
        <input class="input" id="nn-title" placeholder="如 头痛剧烈"></div>
    </div>
    <div class="form-row" id="nn-trigger-row"><div class="form-label">触发关键词（用逗号或空格分隔，可留空后补）</div>
      <input class="input" id="nn-trigger" placeholder="如 头痛, 头疼, 头很痛"></div>
    <div class="form-row" id="nn-ask-row"><div class="form-label">反问话术（医生问病人的原话，可留空）</div>
      <input class="input" id="nn-ask" placeholder="如 是不是头痛得很厉害、像要裂开一样？"></div>
    <div class="form-row" id="nn-contra-row" style="display:none"><div class="form-label">禁忌/注意事项（逗号分隔）</div>
      <input class="input" id="nn-contra" placeholder="如 表实无汗者主之, 服药取微汗"></div>
    <div class="err hidden" id="nn-err"></div>`,
    buttons: [
      { label: '取消', onClick: c => c() },
      {
        label: '创建', kind: 'primary', onClick: (c, body) => {
          const kind = body.querySelector('#nn-kind').value
          const name = body.querySelector('#nn-name').value.trim()
          const title = body.querySelector('#nn-title').value.trim()
          const err = body.querySelector('#nn-err')
          const fail = m => { err.textContent = m; err.classList.remove('hidden') }
          if (!/^[a-z][a-z0-9_]*$/.test(name)) return fail('name 不合法：小写字母开头，只能含小写字母、数字、下划线')
          if (node(name)) return fail('已存在同名节点：' + name)
          if (!title) return fail('请填写中文标题')
          const split = v => v.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean)
          const spec = {
            name, title, kind,
            trigger: split(body.querySelector('#nn-trigger').value),
            ask: body.querySelector('#nn-ask').value.trim(),
            contraindications: split(body.querySelector('#nn-contra').value)
          }
          const isLeaf = kind === 'symptom' || kind === 'pulse'
          if (isLeaf && !spec.trigger.length) {
            // 允许，但提醒
            toast('注意：没有触发关键词的症状只能靠反问确认', 'warn')
          }
          S.sel = new Set()
          addNode(spec)
          c()
          S.sel = new Set([name])
          render(); renderList(); refreshRight()
          centerOn(name)
          toast(`已创建 ${title}（还没保存）`, 'ok')
        }
      }
    ]
  })

  // 类型联动：显示/隐藏字段
  const kindSel = document.querySelector('#nn-kind')
  const sync = () => {
    const k = kindSel.value
    const leaf = k === 'symptom' || k === 'pulse'
    document.querySelector('#nn-trigger-row').style.display = leaf ? '' : 'none'
    document.querySelector('#nn-ask-row').style.display = leaf ? '' : 'none'
    document.querySelector('#nn-contra-row').style.display = leaf ? 'none' : ''
  }
  kindSel.addEventListener('change', sync)
  sync()
}

// ------------------------------------------------------------
// 保存流程
// ------------------------------------------------------------

async function doSave() {
  const payload = buildPayload()
  const total = payload.updated.length + payload.created.length + payload.renamed.length + payload.deleted.length
  if (!total && !S.layoutDirty) { toast('没有需要保存的改动', 'warn'); return }

  let plan
  try {
    plan = await api.postSave(Object.assign({}, payload, { dryRun: true }))
  } catch (e) { toast('预览失败：' + e.message, 'err'); return }

  const fileHtml = (plan.files || []).map(f => {
    const head = f.kind === 'delete'
      ? `<span style="color:#f87171">删除</span> ${esc(f.relPath)}`
      : f.kind === 'create'
        ? `<span style="color:#34d399">新建</span> ${esc(f.relPath)}`
        : f.kind === 'rename'
          ? `<span style="color:#fbbf24">改名</span> ${esc(f.relPath)} → ${esc(f.toPath)}`
          : `<span class="muted">修改</span> ${esc(f.relPath)}`
    const adds = f.diff.filter(d => d.t === '+').length
    const dels = f.diff.filter(d => d.t === '-').length
    const lines = f.diff.map(d => {
      const cls = d.t === '+' ? 'dl-add' : (d.t === '-' ? 'dl-del' : 'dl-ctx')
      return `<span class="${cls}">${esc(d.t === ' ' ? '  ' + d.s : d.t + ' ' + d.s)}</span>`
    }).join('\n')
    return `<div class="diff-file">
      <div class="diff-file-head"><span>${head}</span><span class="diff-stat">+${adds} −${dels}</span></div>
      ${f.notes && f.notes.length ? `<div class="modal-note" style="padding:6px 10px">${f.notes.map(n => '· ' + esc(n)).join('<br>')}</div>` : ''}
      <pre class="diff">${lines}</pre>
    </div>`
  }).join('')

  const errHtml = (plan.errors || []).length
    ? `<div class="err"><b>发现 ${plan.errors.length} 个问题，已阻止保存：</b><br>${plan.errors.map(e => '· ' + esc(e)).join('<br>')}</div>`
    : ''
  const noteHtml = (plan.notes || []).length
    ? `<div class="warn">${plan.notes.map(n => '· ' + esc(n)).join('<br>')}</div>`
    : ''

  openModal({
    title: plan.ok ? `保存预览：将改动 ${(plan.files || []).length} 个文件` : '保存被阻止',
    width: 'min(980px,94vw)',
    body: `<div class="modal-note">
        下面是<b>真实写盘内容</b>的逐行 diff。未被改动的字段、注释、空行都不会动。
        写盘前会把原文件备份到 <code>dev/.backups/&lt;时间戳&gt;/</code>。
      </div>
      ${errHtml}${noteHtml}
      ${fileHtml || '<div class="result-empty">没有文件需要改动</div>'}`,
    buttons: [
      { label: '取消', onClick: c => c() },
      {
        label: plan.ok ? '确认写回磁盘' : '无法保存',
        kind: 'primary',
        disabled: !plan.ok,
        onClick: async (close) => {
          close()
          try {
            const res = await api.postSave(Object.assign({}, payload, { dryRun: false }))
            if (!res.ok) {
              toast('写入失败：' + (res.errors || []).join('；'), 'err', 9000)
              openModal({ title: '写入后复核发现问题', body: `<div class="err">${(res.errors || []).map(e => esc(e)).join('<br>')}</div>`, buttons: [{ label: '关闭', onClick: c => c() }] })
              return
            }
            // 平台（云平台）模式下医生提交的是草稿：不落盘、等管理员审核
            if (res.submitted) {
              const meta = res.meta || {}
              toast(`已提交审核：草稿 #${res.draftId}（${meta.fileCount || 0} 个文件 / ${meta.changedLines || 0} 行改动）`, 'ok', 9000)
              toast('管理员通过后才会写入条文库', 'warn', 9000)
              return
            }
            S.layoutDirty = false
            const n = res.written ? res.written.length : 0
            toast(`已写回 ${n} 个文件`, 'ok')
            if (res.reload && res.reload.ok) {
              toast('主服务已热重载插件 ✓', 'ok')
            } else if (res.reload && res.reload.error) {
              toast('主服务未重载：' + res.reload.error + '（重新启动主服务即可）', 'warn', 8000)
            }
            await reload()
          } catch (e) {
            toast('写入失败：' + e.message, 'err', 9000)
          }
        }
      }
    ]
  })
}

// ------------------------------------------------------------
// 状态栏
// ------------------------------------------------------------

function setStatus(text) {
  const s = document.getElementById('status-left')
  if (s) s.textContent = text
}

boot()
