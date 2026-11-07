'use strict'
// dev/public/js/panels.js
// 右侧三个面板：实时模拟 / 条文反向视图 / 问诊回放
//
// 数据来源全部是服务端真跑的引擎（dev/lib/graph.js → engine/engine.js + engine/asker.js），
// 这里只负责「如实渲染」，不改写引擎语义：
//   · needs 任一路径被明确阻断 → 整个节点判 no（哪怕另一条路径只是「还不知道」）；
//     服务端在 explanations[name].pathConflict 里标记了这种情况，面板单独成一个警示区。
//   · 三态：yes(是) / no(否) / unknown(未知)。
//
// 渲染同样遵循「整段重建 + 事件绑在本次新建的根元素上」，所以刷新不会累积监听器。

import { S, emit } from './store.js'
import { postSimulate, postWalk, getReverse } from './api.js'
import { esc, toast } from './ui.js'

// ------------------------------------------------------------
// 模块状态（刷新面板时不丢）
// ------------------------------------------------------------

let host = null          // 最近一次使用的容器
let panel = 'sim'        // 'sim' | 'chain' | 'walk'

const ui = {
  simSearch: '',
  onlyLeaf: true,        // 「只看输入层」开关
  simKeyAtRun: null,     // 上次模拟时的症状设定指纹，用来提示「结果已过期」
  chainSearch: '',
  chainClosed: new Set(),
  chainAutoTried: null,
  walkSearch: '',
  truth: {},             // { name: 'yes' | 'no' }
  dontKnow: new Set()    // 强制答「不知道」的节点
}

const KIND_LABEL = { symptom: '症状', pulse: '脉象', summary: '证候', formula: '方剂' }
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫']

function kindLabel(kind) { return KIND_LABEL[kind] || '未知' }
function pathLabel(i) { return '路径 ' + (CIRCLED[i] || String(i + 1)) }
function listOf(v) { return Array.isArray(v) ? v : [] }
function nodeTitle(name) { const n = S.nodes.get(name); return n ? (n.title || n.name) : name }
function nodeKind(name) { const n = S.nodes.get(name); return n ? n.kind : null }
function allNodes() { return S.order.map(n => S.nodes.get(n)).filter(Boolean) }
function triLabel(s) { return s === 'yes' ? '是' : (s === 'no' ? '否' : '未知') }
function triColor(s) { return s === 'yes' ? 'var(--ok)' : (s === 'no' ? 'var(--danger)' : 'var(--text-2)') }

function devSelect(name) {
  if (typeof window === 'undefined') return
  if (typeof window.__devSelect === 'function') window.__devSelect(name)
}

// ------------------------------------------------------------
// 焦点/滚动保持
// ------------------------------------------------------------

function snapUi(root) {
  const out = { fk: null, sel: null, scrolls: [] }
  if (typeof document === 'undefined') return out
  try {
    const a = document.activeElement
    if (a && root.contains && root.contains(a) && a.getAttribute) {
      out.fk = a.getAttribute('data-fk')
      if (out.fk && typeof a.selectionStart === 'number') out.sel = [a.selectionStart, a.selectionEnd]
    }
    root.querySelectorAll('[data-scroll]').forEach(el => out.scrolls.push([el.getAttribute('data-scroll'), el.scrollTop]))
  } catch (_) { /* 极简测试 DOM：忽略 */ }
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

export function renderSimPanel(container) {
  if (!container) return
  host = container
  panel = 'sim'
  drawSim()
}

export function renderChainPanel(container) {
  if (!container) return
  host = container
  panel = 'chain'
  drawChain()
}

export function renderWalkPanel(container) {
  if (!container) return
  host = container
  panel = 'walk'
  drawWalk()
}

/** 重新渲染最近使用的那个面板（app.js 在状态变化后调用） */
export function refreshPanels() {
  if (!host || !panel) return
  // 标签页切换时 app.js 可能只切了 .hidden，这里重新对准规范容器
  const id = { sim: 'tab-sim', chain: 'tab-chain', walk: 'tab-walk' }[panel]
  const doc = typeof document !== 'undefined' ? document : null
  const el = (doc && id) ? doc.getElementById(id) : null
  if (el) host = el
  if (panel === 'sim') drawSim()
  else if (panel === 'chain') drawChain()
  else drawWalk()
}

/** 最近一次模拟结果（供 app.js 给画布着色） */
export function currentSim() { return S.sim }

// ============================================================
// 一、实时模拟面板
// ============================================================

function simKeyOfInput() {
  const inp = S.simInput || {}
  return Object.keys(inp).sort().map(k => k + '=' + inp[k]).join(',')
}
function simStale() {
  return !!(S.sim && ui.simKeyAtRun !== null && ui.simKeyAtRun !== simKeyOfInput())
}

function drawSim() {
  if (!host) return
  const snap = snapUi(host)
  host.innerHTML = '<div class="sim">'
    + '<div class="panel-note">勾选症状的三态，点「开始模拟」——这里是调用真实引擎 engine.js 推演，不是模拟实现。任一路径被明确否定 → 该方剂判为不成立。</div>'
    + simActionsHtml()
    + '<input class="input sim-search" data-fk="sim-search" placeholder="搜索：中文名 / name / 触发词…" value="' + esc(ui.simSearch) + '">'
    + '<div class="sim-list" data-scroll="sim">' + simRowsHtml() + '</div>'
    + '<div class="result-empty hidden" data-empty="sim">没有匹配的症状。</div>'
    + '<div class="sim-results">' + simResultsHtml() + '</div>'
    + '</div>'
  const root = host.firstElementChild
  if (root) bindSim(root)
  restoreUi(host, snap)
}

function simActionsHtml() {
  const total = allNodes().filter(n => n.isLeaf).length
  const assigned = Object.keys(S.simInput || {}).length
  return '<div class="sim-actions">'
    + '<button class="btn btn-sm btn-primary" data-act="run">▶ 开始模拟</button>'
    + '<button class="btn btn-sm" data-act="clear">全部清空</button>'
    + '<button class="btn btn-sm btn-ghost" data-act="toggle-leaf" title="关掉后会连证候/方剂一起列出，可以手动强制设定它们的真假">只看输入层：'
    + (ui.onlyLeaf ? '开' : '关') + '</button>'
    + '<span class="hint" style="align-self:center" data-assigned>已设定 ' + assigned + ' 项 · 输入层共 ' + total + ' 个</span>'
    + '</div>'
}

function simRowsHtml() {
  const rows = allNodes().filter(n => ui.onlyLeaf ? n.isLeaf : true)
  if (!rows.length) return '<div class="result-empty">还没有载入节点（点顶栏「重新载入」）。</div>'
  return rows.map(n => {
    const v = (S.simInput || {})[n.name]
    const cls = v === 'yes' ? 'state-yes' : (v === 'no' ? 'state-no' : 'state-unknown')
    return '<div class="sim-row ' + cls + '" data-name="' + esc(n.name) + '"'
      + ' data-title="' + esc(n.title || '') + '" data-kw="' + esc(listOf(n.trigger).join(' ')) + '">'
      + '<span class="kind-tag kind-' + esc(n.kind) + '">' + esc(kindLabel(n.kind)) + '</span>'
      + '<span class="sim-title">' + esc(n.title || n.name) + ' <span class="muted mono">' + esc(n.name) + '</span></span>'
      + '<span class="tri">'
      + '<button class="tri-btn' + (v === 'yes' ? ' active' : '') + '" data-v="yes">是</button>'
      + '<button class="tri-btn' + (v === 'no' ? ' active' : '') + '" data-v="no">否</button>'
      + '<button class="tri-btn' + (v === 'unknown' ? ' active' : '') + '" data-v="unknown">未知</button>'
      + '</span></div>'
  }).join('')
}

function simResultsHtml() {
  const sim = S.sim
  if (!sim) {
    return '<div class="result-empty">还没有模拟结果：先给症状设定「是 / 否」，再点「▶ 开始模拟」。</div>'
  }
  const out = []
  if (simStale()) {
    out.push('<div class="result-empty" style="color:var(--warn)">⚠ 下面是上一次的模拟结果：你改过症状设定，请重新点「▶ 开始模拟」。</div>')
  }
  out.push(simGroupHtml('成立的方剂', sim.yesFormulas, 'formula'))
  out.push(simGroupHtml('成立的证候', sim.yesSummaries, 'summary'))
  out.push(simBlockedHtml(sim))
  out.push(simContraHtml(sim))
  out.push(simConflictHtml(sim))
  out.push(simNextHtml(sim))
  out.push(simCandidatesHtml(sim))
  return out.join('')
}

function simGroupHtml(title, list, kind) {
  const arr = listOf(list)
  const out = ['<div class="result-group"><div class="result-head">' + esc(title) + '（' + arr.length + '）</div>']
  if (!arr.length) out.push('<div class="result-empty">（无）</div>')
  else {
    out.push('<ul class="result-list">')
    arr.forEach(f => out.push(resultItemHtml(f.name, kind, '')))
    out.push('</ul>')
  }
  out.push('</div>')
  return out.join('')
}

function resultItemHtml(name, kind, tail) {
  return '<li class="result-item" data-goto="' + esc(name) + '" style="cursor:pointer" title="点击在画布上选中它">'
    + (kind ? '<span class="kind-tag kind-' + esc(kind) + '">' + esc(kindLabel(kind)) + '</span>' : '')
    + '<span class="result-title">' + esc(nodeTitle(name)) + '</span>'
    + '<code>' + esc(name) + '</code>'
    + (tail ? '<span class="muted nowrap">' + esc(tail) + '</span>' : '')
    + '</li>'
}

/** 被阻断的方剂：explanations 里 kind=formula 且 status='no' */
function simBlockedHtml(sim) {
  const exps = Object.keys(sim.explanations || {})
    .map(k => sim.explanations[k])
    .filter(e => e.kind === 'formula' && e.status === 'no')
  const out = ['<div class="result-group"><div class="result-head">被阻断的方剂（' + exps.length + '）</div>']
  if (!exps.length) out.push('<div class="result-empty">（无：没有被明确否掉的方剂）</div>')
  else {
    out.push('<ul class="result-list">')
    exps.forEach(e => {
      // 把所有卡死它的条件都写出来（含极性），不只第一条，否则看不出缺哪些症状
      const bad = allBlockers(e)
      const shown = bad.slice(0, 3).join('、') + (bad.length > 3 ? ' 等 ' + bad.length + ' 项' : '')
      out.push(resultItemHtml(e.name, 'formula', bad.length ? '被 ' + shown + ' 阻断' : '已被阻断'))
    })
    out.push('</ul>')
    out.push('<div class="hint">「明确否定」指该条件要求「是」而实际「否」，或要求「非」而实际「是」。</div>')
  }
  out.push('</div>')
  return out.join('')
}

/** 找第一条把路径卡死的条件（ok===false 且不是 unknown） */
function firstBlocker(exp) {
  for (const p of listOf(exp.paths)) {
    for (const c of listOf(p.conds)) if (!c.ok && !c.unknown) return c
  }
  return null
}

/** 条件的中文描述：中文名 + 极性（非） */
function condLabel(c) {
  return (c.title || c.ref) + (c.want === 'no' ? '(非)' : '')
}

/** 所有把该节点卡死的条件（去重、带给极性的中文名），按路径顺序 */
function allBlockers(exp) {
  const seen = new Set()
  const out = []
  for (const p of listOf(exp.paths)) {
    for (const c of listOf(p.conds)) {
      if (c.ok || c.unknown) continue
      const label = condLabel(c)
      if (seen.has(label)) continue
      seen.add(label)
      out.push(label)
    }
  }
  return out
}

function simContraHtml(sim) {
  const arr = listOf(sim.contraindications)
  const out = ['<div class="result-group"><div class="result-head">禁忌汇总（' + arr.length + '）</div>']
  if (!arr.length) out.push('<div class="result-empty">（无：当前没有成立的方剂/证候带禁忌）</div>')
  else {
    out.push('<ul class="result-list">')
    arr.forEach(t => out.push('<li class="result-item"><span class="result-title">' + esc(t) + '</span></li>'))
    out.push('</ul>')
    out.push('<div class="hint">这是所有成立节点禁忌的并集，给病人看的就是这份列表。</div>')
  }
  out.push('</div>')
  return out.join('')
}

/** 路径冲突：引擎已判否，但按 OR 语义还有路径没被否死 */
function simConflictHtml(sim) {
  const arr = listOf(sim.conflicts)
  if (!arr.length) {
    return '<div class="result-group"><div class="result-head">⚠ 路径冲突（0）</div>'
      + '<div class="result-empty">本次没有「引擎判否、但 OR 语义仍有路径」的节点。</div></div>'
  }
  const out = ['<div class="result-group conflict"><div class="result-head">⚠ 路径冲突（' + arr.length + '）</div>',
    '<div class="hint">这些节点引擎已判为「否」，但按 OR 语义仍有某条路径没被否死 —— 这是引擎的真实行为（任一路径被明确阻断即判 no），不是面板算错。</div>',
    '<ul class="result-list">']
  arr.forEach(c => {
    const ex = (sim.explanations || {})[c.name]
    const blocked = listOf(ex && ex.paths).filter(p => p.status === 'blocked')
    const alive = listOf(ex && ex.paths).filter(p => p.status === 'pending' || p.status === 'ok')
    const bIdx = blocked.map(p => p.index + 1).join('、')
    const aIdx = alive.map(p => p.index + 1).join('、')
    const badTxt = blocked.map(p =>
      listOf(p.conds).filter(x => !x.ok && !x.unknown).map(x => x.title || x.ref).join('、')).join('；')
    out.push('<li class="result-item" data-goto="' + esc(c.name) + '" style="cursor:pointer">'
      + '<span class="kind-tag kind-' + esc(nodeKind(c.name) || 'formula') + '">' + esc(kindLabel(nodeKind(c.name) || 'formula')) + '</span>'
      + '<span class="result-title">' + esc(c.title || c.name) + '</span><code>' + esc(c.name) + '</code></li>')
    out.push('<li class="result-item"><span class="muted" style="color:var(--conflict)">该节点引擎已判否'
      + (bIdx ? '（第 ' + bIdx + ' 条路径被「' + esc(badTxt || '未知条件') + '」明确阻断）' : '')
      + (aIdx ? '，但按 OR 语义第 ' + aIdx + ' 条路径仍有希望' : '，其余路径也未能走通') + '</span></li>')
  })
  out.push('</ul></div>')
  return out.join('')
}

function simNextHtml(sim) {
  const q = sim.nextQuestion
  const out = ['<div class="result-group"><div class="result-head">下一个会问的问题</div>']
  if (!q) out.push('<div class="result-empty">没有可问的了（候选已收敛，或剩下候选之间已无区分度）。</div>')
  else {
    out.push('<div class="result-item"><span class="result-title">引擎下一步会反问：<b>' + esc(q.title || q.leaf)
      + '</b>（区分度 ' + esc(q.count) + '，当前候选 ' + esc(q.total) + ' 个）</span></div>')
    out.push('<div class="hint">医生要说的话：「' + esc(q.phrase || q.title || '') + '」（<code class="mono">' + esc(q.leaf) + '</code>）</div>')
  }
  out.push('</div>')
  return out.join('')
}

function simCandidatesHtml(sim) {
  const arr = listOf(sim.candidates)
  const out = ['<div class="result-group"><div class="result-head">候选方剂数量：' + arr.length + '</div>']
  if (!arr.length) out.push('<div class="result-empty">（无候选：所有方剂都被否掉了）</div>')
  else {
    out.push('<ul class="result-list">')
    arr.forEach(c => out.push(resultItemHtml(c.name, 'formula', '')))
    out.push('</ul>')
    out.push('<div class="hint">引擎认为这些方剂「还没被否死」（Asker 用它们算下一个反问）。</div>')
  }
  out.push('</div>')
  return out.join('')
}

function bindSim(root) {
  const searchEl = root.querySelector('[data-fk="sim-search"]')
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      ui.simSearch = searchEl.value
      filterList(root, '.sim-list', searchEl.value)
    })
    filterList(root, '.sim-list', ui.simSearch)
  }

  root.addEventListener('click', ev => {
    const t = ev.target
    // 三态按钮
    const tri = t.closest ? t.closest('.tri-btn') : null
    if (tri) {
      const row = tri.closest('.sim-row')
      if (!row) return
      const name = row.dataset.name
      const v = tri.dataset.v
      S.simInput = S.simInput || {}
      if (v === 'yes' || v === 'no') S.simInput[name] = v
      else delete S.simInput[name]
      row.querySelectorAll('.tri-btn').forEach(b => b.classList.toggle('active', b === tri))
      row.classList.remove('state-yes', 'state-no', 'state-unknown')
      row.classList.add(v === 'yes' ? 'state-yes' : (v === 'no' ? 'state-no' : 'state-unknown'))
      updateAssigned(root)
      return
    }
    // 结果里的节点跳转
    const go = t.closest ? t.closest('[data-goto]') : null
    if (go) { devSelect(go.dataset.goto); return }
    // 动作按钮
    const act = t.closest ? t.closest('[data-act]') : null
    if (!act) return
    if (act.dataset.act === 'run') runSim(root, act)
    else if (act.dataset.act === 'clear') clearSim()
    else if (act.dataset.act === 'toggle-leaf') { ui.onlyLeaf = !ui.onlyLeaf; drawSim() }
  })
}

function updateAssigned(root) {
  const el = root.querySelector('[data-assigned]')
  if (!el) return
  const total = allNodes().filter(n => n.isLeaf).length
  el.textContent = '已设定 ' + Object.keys(S.simInput || {}).length + ' 项 · 输入层共 ' + total + ' 个'
}

/** 列表搜索：只改 display，避免重建 DOM（保住滚动位置与焦点） */
function filterList(root, listSel, q) {
  const list = root.querySelector(listSel)
  if (!list) return
  const kw = String(q || '').trim().toLowerCase()
  let shown = 0
  list.querySelectorAll('.sim-row, .walk-truth-row, .dep-item').forEach(row => {
    let hit = true
    if (kw) {
      const name = String(row.dataset.name || '').toLowerCase()
      const title = String(row.dataset.title || '').toLowerCase()
      const kws = String(row.dataset.kw || '').toLowerCase()
      hit = name.indexOf(kw) >= 0 || title.indexOf(kw) >= 0 || kws.indexOf(kw) >= 0
    }
    row.style.display = hit ? '' : 'none'
    if (hit) shown++
  })
  const empty = root.querySelector('[data-empty="' + (listSel === '.sim-list' ? 'sim' : 'other') + '"]')
  if (empty) empty.classList.toggle('hidden', shown > 0)
}

async function runSim(root, btn) {
  if (btn) btn.disabled = true
  try {
    const r = await postSimulate(S.simInput || {})
    S.sim = r
    ui.simKeyAtRun = simKeyOfInput()
    emit('sim-updated')
    const conflicts = listOf(r && r.conflicts).length
    toast('模拟完成：成立方剂 ' + listOf(r && r.yesFormulas).length + ' 个，候选 ' + listOf(r && r.candidates).length + ' 个'
      + (conflicts ? '，⚠ 路径冲突 ' + conflicts + ' 处' : ''), conflicts ? 'warn' : 'ok')
  } catch (e) {
    toast('模拟失败：' + e.message, 'err')
  }
  if (btn) btn.disabled = false
  drawSim()
}

function clearSim() {
  S.simInput = {}
  S.sim = null
  ui.simKeyAtRun = null
  emit('sim-updated')
  toast('已清空症状设定与模拟结果')
  drawSim()
}

// ============================================================
// 二、条文反向视图（依赖树）
// ============================================================

function drawChain() {
  if (!host) return
  const snap = snapUi(host)
  host.innerHTML = '<div class="chain">' + chainHtml() + '</div>'
  const root = host.firstElementChild
  if (root) bindChain(root)
  restoreUi(host, snap)

  // 第一次打开时，自动以当前选中的节点为根加载一次（只试一次，避免请求循环）
  if (!S.chain && !ui.chainAutoTried) {
    const pick = ui.chainSearch || (S.sel ? [...S.sel][0] : null)
    if (pick && S.nodes.has(pick)) {
      ui.chainAutoTried = pick
      const name = pick
      setTimeout(() => loadChain(name), 0)
    }
  }
}

function chainHtml() {
  const out = []
  out.push('<div class="panel-note">条文反向视图：以某个节点为根，向下展开它成立所依赖的全部条件（路径内 AND，路径间 OR）。点「▾ / ▸」折叠分支。</div>')
  out.push('<div class="chain-head">'
    + '<input class="input" data-fk="chain-search" placeholder="搜索节点：中文名 / name / 触发词…" value="' + esc(ui.chainSearch) + '">'
    + '<label class="tcheck nowrap"><span>深度</span><input class="num" type="number" min="1" max="10" data-fk="chain-depth" value="' + esc(String(chainDepth())) + '"></label>'
    + '<button class="btn btn-sm btn-primary" data-act="chain-load">加载</button>'
    + '</div>')
  const hits = chainSuggestions(ui.chainSearch)
  out.push('<div class="sim-list' + (ui.chainSearch.trim() ? '' : ' hidden') + '" data-suggest data-scroll="suggest">'
    + (hits.length
      ? hits.map(chainSuggestRowHtml).join('')
      : '<div class="result-empty">没有匹配的节点。</div>')
    + '</div>')

  const ch = S.chain
  if (!ch) out.push('<div class="result-empty">还没有加载：在上面输入节点名，选中后会自动展开它的依赖树。</div>')
  else if (!ch.data || ch.data.ok === false) out.push('<div class="result-empty">加载失败：' + esc((ch.data && ch.data.error) || '未知原因') + '</div>')
  else {
    out.push('<div class="hint">根节点：<b>' + esc(nodeTitle(ch.data.root.name)) + '</b> (<code class="mono">' + esc(ch.data.root.name) + '</code>) · 深度上限 ' + esc(String(ch.depth)) + '</div>')
    out.push('<div class="tree">' + treeNodeHtml(ch.data.root, 0, 'r') + '</div>')
    out.push(depListHtml(ch.data.dependents, ch.data.root.name))
  }
  return out.join('')
}

function chainDepth() {
  if (!S.chain || !S.chain.depth) return 6
  return S.chain.depth
}

function chainSuggestions(q) {
  const kw = String(q || '').trim().toLowerCase()
  if (!kw) return []
  return allNodes().filter(n =>
    n.name.toLowerCase().indexOf(kw) >= 0
    || String(n.title || '').toLowerCase().indexOf(kw) >= 0
    || listOf(n.trigger).some(t => String(t).toLowerCase().indexOf(kw) >= 0)
  ).slice(0, 20)
}

function chainSuggestRowHtml(n) {
  return '<div class="dep-item" data-load="' + esc(n.name) + '" style="cursor:pointer">'
    + '<span class="kind-tag kind-' + esc(n.kind) + '">' + esc(kindLabel(n.kind)) + '</span>'
    + '<span class="nowrap">' + esc(n.title || n.name) + '</span>'
    + '<code class="muted">' + esc(n.name) + '</code>'
    + '<span style="flex:1"></span>'
    + '<span class="hint">展开依赖树</span></div>'
}

/** 递归渲染依赖树；idpath 是按位置生成的稳定 id，用于折叠状态 */
function treeNodeHtml(n, depth, idpath) {
  const d = Math.min(depth, 8)
  const paths = listOf(n.paths)
  const hasKids = !n.leaf && paths.length > 0
  const closed = ui.chainClosed.has(idpath)
  const out = ['<div class="tree-node">']
  out.push('<div class="tree-row depth-' + d + '">')
  out.push(hasKids
    ? '<button class="tree-toggle" data-act="toggle" data-nid="' + esc(idpath) + '">' + (closed ? '▸' : '▾') + '</button>'
    : '<span class="tree-toggle"></span>')
  if (n.missing) out.push('<span class="kind-tag">缺失</span>')
  else if (n.kind) out.push('<span class="kind-tag kind-' + esc(n.kind) + '">' + esc(kindLabel(n.kind)) + '</span>')
  out.push('<span class="tree-title">' + esc(n.title || n.name) + '</span>')
  out.push('<code>' + esc(n.name) + '</code>')
  if (n.pol === 'no') out.push('<span class="pol pol-no">非</span>')
  if (listOf(n.trigger).length) out.push('<span class="mini-badge">' + listOf(n.trigger).length + '词</span>')
  else if (n.hasTrigger) out.push('<span class="mini-badge warn">自定义函数</span>')
  if (listOf(n.contraindications).length) out.push('<span class="mini-badge">禁忌' + listOf(n.contraindications).length + '</span>')
  if (n.truncated) out.push('<span class="mini-badge warn">深度截断</span>')
  const st = simStateHtml(n.name)
  if (st) out.push('<span style="flex:1"></span>' + st)
  out.push('</div>')

  // 叶子：医生要问病人的原话
  if (n.leaf && n.ask) {
    out.push('<div class="tree-cond depth-' + Math.min(d + 1, 8) + '">'
      + '<span class="hint">医生要问：' + esc(n.ask) + '</span></div>')
  }

  if (hasKids) {
    out.push('<div class="tree-paths" data-kids="' + esc(idpath) + '"' + (closed ? ' style="display:none"' : '') + '>')
    paths.forEach(p => {
      out.push('<div class="tree-path">')
      if (paths.length > 1) {
        out.push('<div class="tree-cond"><span class="path-idx">' + pathLabel(p.index) + '</span>'
          + '<span class="hint">本条路径内条件全部满足即成立</span></div>')
      }
      listOf(p.conds).forEach((c, ci) => out.push(treeNodeHtml(c.node || { name: c.ref, title: c.ref, pol: c.pol, paths: [] }, d + 1, idpath + '.' + p.index + '.' + ci)))
      out.push('</div>')
    })
    out.push('</div>')
  }
  out.push('</div>')
  return out.join('')
}

function simStateHtml(name) {
  const sim = S.sim
  if (!sim || !sim.states) return ''
  const st = sim.states[name]
  if (!st) return ''
  return '<span class="muted nowrap" style="color:' + triColor(st) + '" title="上一次模拟里这个节点的状态">当前：' + triLabel(st) + '</span>'
}

function depListHtml(deps, rootName) {
  const arr = listOf(deps)
  const out = ['<div class="field-group">']
  out.push('<div class="field-group-head"><span>被谁依赖</span><span class="hint">' + arr.length + ' 处</span></div>')
  if (!arr.length) out.push('<div class="hint">没有任何节点引用「' + esc(nodeTitle(rootName)) + '」。</div>')
  else {
    out.push('<ul class="dep-list">')
    arr.slice(0, 80).forEach(d => {
      out.push('<li class="dep-item" data-goto="' + esc(d.name) + '" style="cursor:pointer" title="点击在画布上选中它">')
      out.push('<span class="kind-tag kind-' + esc(d.kind) + '">' + esc(kindLabel(d.kind)) + '</span>')
      out.push('<span class="nowrap">' + esc(d.title || d.name) + '</span>')
      out.push('<code class="muted">' + esc(d.name) + '</code>')
      out.push('<span style="flex:1"></span>')
      out.push('<span class="muted nowrap">' + pathLabel(d.path) + '</span>')
      out.push('<span class="pol ' + (d.pol === 'no' ? 'pol-no' : 'pol-yes') + '">' + (d.pol === 'no' ? '非' : '是') + '</span>')
      out.push('</li>')
    })
    out.push('</ul>')
    if (arr.length > 80) out.push('<div class="hint">只显示前 80 处，共 ' + arr.length + ' 处。</div>')
  }
  out.push('</div>')
  return out.join('')
}

function bindChain(root) {
  const searchEl = root.querySelector('[data-fk="chain-search"]')
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      ui.chainSearch = searchEl.value
      paintSuggest(root)
    })
    searchEl.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); loadFromSearch() }
      else if (ev.key === 'Escape') {
        const box = root.querySelector('[data-suggest]')
        if (box) box.classList.add('hidden')
      }
    })
  }
  const depthEl = root.querySelector('[data-fk="chain-depth"]')
  if (depthEl) {
    depthEl.addEventListener('change', () => {
      const v = Math.max(1, Math.min(10, Number(depthEl.value) || 6))
      depthEl.value = String(v)
      if (S.chain && S.chain.name) loadChain(S.chain.name, v)
    })
  }
  root.addEventListener('click', ev => {
    const t = ev.target
    const tg = t.closest ? t.closest('[data-act="toggle"]') : null
    if (tg) {
      const id = tg.dataset.nid
      const kids = root.querySelector('[data-kids="' + id + '"]')
      const closed = ui.chainClosed.has(id)
      if (closed) ui.chainClosed.delete(id); else ui.chainClosed.add(id)
      if (kids) kids.style.display = closed ? '' : 'none'
      tg.textContent = closed ? '▾' : '▸'
      return
    }
    const load = t.closest ? t.closest('[data-load]') : null
    if (load) { loadChain(load.dataset.load); return }
    const go = t.closest ? t.closest('[data-goto]') : null
    if (go) { devSelect(go.dataset.goto); return }
    const act = t.closest ? t.closest('[data-act="chain-load"]') : null
    if (act) loadFromSearch()
  })
}

function paintSuggest(root) {
  const box = root.querySelector('[data-suggest]')
  if (!box) return
  const q = ui.chainSearch.trim()
  if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return }
  const hits = chainSuggestions(q)
  box.innerHTML = hits.length
    ? hits.map(chainSuggestRowHtml).join('')
    : '<div class="result-empty">没有匹配的节点。</div>'
  box.classList.remove('hidden')
}

/** 用搜索框内容加载：优先精确 name，否则取第一条建议 */
function loadFromSearch() {
  const q = ui.chainSearch.trim()
  if (!q) { toast('先输入要展开的节点名', 'warn'); return }
  if (S.nodes.has(q)) { loadChain(q); return }
  const hits = chainSuggestions(q)
  if (!hits.length) { toast('没有匹配「' + q + '」的节点', 'err'); return }
  loadChain(hits[0].name)
}

async function loadChain(name, depth) {
  if (!name) return
  const d = depth || chainDepth()
  ui.chainSearch = name
  try {
    const data = await getReverse(name, d)
    if (!data || data.ok === false) {
      S.chain = { name, depth: d, data: data || { ok: false, error: '返回为空' } }
      toast('加载依赖树失败：' + ((data && data.error) || '未知原因'), 'err')
    } else {
      S.chain = { name, depth: d, data }
      ui.chainClosed = new Set()
    }
  } catch (e) {
    S.chain = { name, depth: d, data: { ok: false, error: e.message } }
    toast('加载依赖树失败：' + e.message, 'err')
  }
  if (panel === 'chain') drawChain()
}

// ============================================================
// 三、问诊回放
// ============================================================

function drawWalk() {
  if (!host) return
  const snap = snapUi(host)
  host.innerHTML = '<div class="walk">'
    + '<div class="panel-note">设定病人的真实症状，然后让引擎按真实 Asker 逻辑一步步问下去，看候选方剂怎么收敛。没提到的症状一律按「不知道」回答。</div>'
    + walkSetupHtml()
    + walkResultHtml()
    + '</div>'
  const root = host.firstElementChild
  if (root) bindWalk(root)
  restoreUi(host, snap)
}

function walkLeaves() { return allNodes().filter(n => n.isLeaf) }

function walkSetupHtml() {
  const leaves = walkLeaves()
  return '<div class="walk-setup">'
    + '<div class="walk-actions">'
    + '<button class="btn btn-sm btn-primary" data-act="walk-run">开始回放</button>'
    + '<button class="btn btn-sm" data-act="walk-clear">清空设定</button>'
    + '<button class="btn btn-sm btn-ghost" data-act="walk-to-sim">把这次的真实症状载入实时模拟</button>'
    + '<span class="hint" style="align-self:center" data-walk-count>已设定 ' + Object.keys(ui.truth).length + ' 项症状 · 强制不知道 ' + ui.dontKnow.size + ' 项</span>'
    + '</div>'
    + '<input class="input sim-search" data-fk="walk-search" placeholder="搜索：中文名 / name / 触发词…" value="' + esc(ui.walkSearch) + '">'
    + '<div class="hint">病人的真实情况（没选的一律按「不知道」回答）：</div>'
    + '<div class="walk-truth" data-list="truth" data-scroll="walk-truth">'
    + (leaves.length ? leaves.map(walkTruthRowHtml).join('') : '<div class="result-empty">还没有载入节点。</div>')
    + '</div>'
    + '<div class="hint">强制答「不知道」的节点（可选，勾上后引擎问到这个症状时一定答不知道）：</div>'
    + '<div class="walk-truth" data-list="dontknow" data-scroll="walk-dontknow">'
    + (leaves.length ? leaves.map(walkDontKnowRowHtml).join('') : '<div class="result-empty">还没有载入节点。</div>')
    + '</div>'
    + '</div>'
}

function walkTruthRowHtml(n) {
  const v = ui.truth[n.name] || ''
  return '<div class="walk-truth-row" data-name="' + esc(n.name) + '" data-title="' + esc(n.title || '')
    + '" data-kw="' + esc(listOf(n.trigger).join(' ')) + '">'
    + '<span class="sim-title">' + esc(n.title || n.name) + ' <span class="muted mono">' + esc(n.name) + '</span></span>'
    + '<span class="tri">'
    + '<label class="tri-btn' + (v === 'yes' ? ' active' : '') + '" data-ans="yes" title="病人确实有"><input type="radio" name="wt-' + esc(n.name) + '" value="yes"' + (v === 'yes' ? ' checked' : '') + '> 是</label>'
    + '<label class="tri-btn' + (v === 'no' ? ' active' : '') + '" data-ans="no" title="病人确实没有"><input type="radio" name="wt-' + esc(n.name) + '" value="no"' + (v === 'no' ? ' checked' : '') + '> 否</label>'
    + '<label class="tri-btn' + (v === '' ? ' active' : '') + '" data-ans="unknown" title="不涉及 / 不问"><input type="radio" name="wt-' + esc(n.name) + '" value=""' + (v === '' ? ' checked' : '') + '> 不涉及</label>'
    + '</span></div>'
}

function walkDontKnowRowHtml(n) {
  const on = ui.dontKnow.has(n.name)
  return '<div class="walk-truth-row" data-name="' + esc(n.name) + '" data-title="' + esc(n.title || '')
    + '" data-kw="' + esc(listOf(n.trigger).join(' ')) + '">'
    + '<input type="checkbox" data-dk="' + esc(n.name) + '"' + (on ? ' checked' : '') + '>'
    + '<span class="sim-title">' + esc(n.title || n.name) + ' <span class="muted mono">' + esc(n.name) + '</span></span>'
    + '</div>'
}

function walkResultHtml() {
  const walk = S.walk
  const out = ['<div class="walk-result">']
  if (!walk) {
    out.push('<div class="result-empty">还没有回放结果：先设定几个真实症状，再点「开始回放」。</div>')
    out.push('</div>')
    return out.join('')
  }
  const cands = listOf(walk.candidates)
  if (cands.length === 1) {
    out.push('<div class="result-head" style="color:var(--ok)">✅ 收敛到唯一方剂：'
      + esc(nodeTitle(cands[0].name)) + '（<code class="mono">' + esc(cands[0].name) + '</code>）</div>')
  } else if (cands.length === 0) {
    out.push('<div class="result-head" style="color:var(--danger)">候选已清空：没有方剂成立</div>')
  } else {
    out.push('<div class="result-head" style="color:var(--warn)">多解：还有 ' + cands.length + ' 个候选方剂，问不下去了</div>')
  }

  out.push('<div class="result-group"><div class="result-head">回放步骤（' + listOf(walk.steps).length + ' 步）</div>')
  out.push('<div class="walk-steps">' + listOf(walk.steps).map(walkStepHtml).join('') + '</div></div>')

  out.push(simGroupHtml('最终成立的方剂', walk.yesFormulas, 'formula'))
  out.push(simGroupHtml('最终成立的证候', walk.yesSummaries, 'summary'))
  out.push(simCandidatesHtml(walk))
  out.push(walkFinalStatesHtml(walk))

  const contra = listOf(walk.contraindications)
  out.push('<div class="result-group"><div class="result-head">禁忌（' + contra.length + '）</div>'
    + (contra.length
      ? '<ul class="result-list">' + contra.map(t => '<li class="result-item"><span class="result-title">' + esc(t) + '</span></li>').join('') + '</ul>'
      : '<div class="result-empty">（无）</div>')
    + '</div>')
  out.push('</div>')
  return out.join('')
}

function walkStepHtml(s) {
  if (s.type === 'end') {
    return '<div class="walk-end">第 ' + esc(s.index) + ' 步 · 结束：' + esc(s.reason || '')
      + '（剩余候选 ' + esc(s.candidates) + '）</div>'
  }
  const cls = s.answer === 'yes' ? 'ans-yes' : (s.answer === 'no' ? 'ans-no' : 'ans-unknown')
  const ans = s.answer === 'yes' ? '是' : (s.answer === 'no' ? '否' : '不知道')
  return '<div class="walk-step" data-goto="' + esc(s.leaf || '') + '" style="cursor:pointer" title="点击在画布上选中这个症状">'
    + '<span class="ws-idx">' + esc(s.index) + '</span>'
    + '<div class="ws-body">'
    + '<div class="ws-q">' + esc(s.phrase || s.title || '') + '</div>'
    + '<div class="ws-meta">'
    + '<span class="ws-answer ' + cls + '">答：' + ans + '</span>'
    + '<span>区分度 ' + esc(s.discrimination) + ' · 候选 ' + esc(s.candidatesBefore) + ' → ' + esc(s.candidatesAfter) + '</span>'
    + '<span>' + esc(s.answerSource || '') + '</span>'
    + '</div>'
    + '<div class="hint">症状：' + esc(s.title || '') + ' <code class="mono">' + esc(s.leaf || '') + '</code></div>'
    + '</div></div>'
}

function walkFinalStatesHtml(walk) {
  const fs = walk.finalStates || {}
  const names = Object.keys(fs)
  const yes = names.filter(n => fs[n] === 'yes')
  const no = names.filter(n => fs[n] === 'no')
  const out = ['<div class="result-group"><div class="result-head">最终状态摘要：是 ' + yes.length + ' · 否 ' + no.length + '</div>']
  if (!names.length) out.push('<div class="result-empty">没有任何节点被明确判定（全是不确定）。</div>')
  else {
    out.push('<ul class="result-list">')
    yes.slice(0, 40).forEach(n => out.push(resultItemHtml(n, nodeKind(n), '')))
    out.push('</ul>')
    if (yes.length > 40) out.push('<div class="hint">只列出前 40 个「是」，共 ' + yes.length + ' 个。</div>')
    if (no.length) {
      out.push('<div class="hint">被明确判为「否」的 ' + no.length + ' 个：'
        + esc(no.slice(0, 15).map(nodeTitle).join('、')) + (no.length > 15 ? ' 等' : '') + '</div>')
    }
  }
  out.push('</div>')
  return out.join('')
}

function bindWalk(root) {
  const searchEl = root.querySelector('[data-fk="walk-search"]')
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      ui.walkSearch = searchEl.value
      const kw = searchEl.value.trim().toLowerCase()
      root.querySelectorAll('.walk-truth-row').forEach(row => {
        let hit = true
        if (kw) {
          hit = String(row.dataset.name || '').toLowerCase().indexOf(kw) >= 0
            || String(row.dataset.title || '').toLowerCase().indexOf(kw) >= 0
            || String(row.dataset.kw || '').toLowerCase().indexOf(kw) >= 0
        }
        row.style.display = hit ? '' : 'none'
      })
    })
  }

  const truthBox = root.querySelector('[data-list="truth"]')
  if (truthBox) {
    truthBox.addEventListener('change', ev => {
      const input = ev.target
      if (!input || input.type !== 'radio') return
      const label = input.closest ? input.closest('.tri-btn') : null
      const row = input.closest ? input.closest('.walk-truth-row') : null
      if (!row) return
      const name = row.dataset.name
      const v = input.value
      if (v === 'yes' || v === 'no') ui.truth[name] = v
      else delete ui.truth[name]
      row.querySelectorAll('.tri-btn').forEach(l => l.classList.toggle('active', l === label))
      updateWalkCount(root)
    })
  }

  const dkBox = root.querySelector('[data-list="dontknow"]')
  if (dkBox) {
    dkBox.addEventListener('change', ev => {
      const cb = ev.target
      if (!cb || cb.type !== 'checkbox') return
      const row = cb.closest ? cb.closest('.walk-truth-row') : null
      if (!row) return
      if (cb.checked) ui.dontKnow.add(row.dataset.name)
      else ui.dontKnow.delete(row.dataset.name)
      updateWalkCount(root)
    })
  }

  root.addEventListener('click', ev => {
    const t = ev.target
    const go = t.closest ? t.closest('[data-goto]') : null
    if (go && go.dataset.goto) { devSelect(go.dataset.goto); return }
    const act = t.closest ? t.closest('[data-act]') : null
    if (!act) return
    const a = act.dataset.act
    if (a === 'walk-run') runWalk()
    else if (a === 'walk-clear') { ui.truth = {}; ui.dontKnow = new Set(); S.walk = null; toast('已清空回放设定与结果'); drawWalk() }
    else if (a === 'walk-to-sim') walkToSim()
  })
}

function updateWalkCount(root) {
  const el = root.querySelector('[data-walk-count]')
  if (!el) return
  el.textContent = '已设定 ' + Object.keys(ui.truth).length + ' 项症状 · 强制不知道 ' + ui.dontKnow.size + ' 项'
}

async function runWalk() {
  try {
    const r = await postWalk({ truth: ui.truth, dontKnow: [...ui.dontKnow], maxSteps: 30 })
    S.walk = r
    const cands = listOf(r && r.candidates).length
    toast('回放完成：' + listOf(r && r.steps).length + ' 步，候选方剂 ' + cands + ' 个'
      + (cands === 1 ? '（已收敛到唯一方剂）' : ''), cands === 1 ? 'ok' : 'warn')
  } catch (e) {
    toast('回放失败：' + e.message, 'err')
  }
  drawWalk()
}

/** 把回放用的真实症状搬进实时模拟面板，并立刻重算一次 */
async function walkToSim() {
  const truth = {}
  Object.keys(ui.truth).forEach(k => {
    const v = ui.truth[k]
    if (v === 'yes' || v === 'no') truth[k] = v
  })
  if (!Object.keys(truth).length) { toast('还没有设定任何真实症状', 'warn'); return }
  S.simInput = truth
  try {
    const r = await postSimulate(S.simInput)
    S.sim = r
    ui.simKeyAtRun = simKeyOfInput()
    emit('sim-updated')
    toast('已载入实时模拟面板（' + Object.keys(truth).length + ' 项症状），切到「实时模拟」即可查看')
  } catch (e) {
    emit('sim-updated')
    toast('载入到模拟面板时失败了：' + e.message, 'err')
  }
}
