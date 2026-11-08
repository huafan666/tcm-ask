// platform/public/js/canvas-bridge.js
// ============================================================
// 由平台注入到 /canvas（dev 那套画布）里的溯源层。
//
// 设计（按用户要求）：
//   1. 时机：常驻只显示「出处 + 两个按钮」，溯源与日志**点开才出现**
//   2. 位置：统一用弹窗
//   3. 风格：完全沿用开发端画布的深色变量（--bg/--panel/--card/--accent…）
//
// 不改 dev 任何源码：import 同一个 store 模块拿选中节点，自己往 body 里加面板与弹窗。
// ============================================================

const esc = s => String(s === undefined || s === null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

// 与 dev/public/style.css 的 :root 对齐
const T = {
  bg: '#0f141b', panel: '#151b23', card: '#1b232d', input: '#131a22',
  border: 'rgba(255,255,255,.08)', borderStrong: 'rgba(255,255,255,.14)',
  text: '#e6edf5', text2: '#93a4b8', text3: '#7f92a6',
  accent: '#14b8a6', accentText: '#5eead4', accentSoft: 'rgba(20,184,166,.14)',
  ok: '#34d399', warn: '#fbbf24', danger: '#f87171',
  kSymptom: '#38bdf8', kPulse: '#a78bfa', kSummary: '#fbbf24', kFormula: '#34d399'
}
const SRC_TAG = {
  shanghanlun: { text: '伤寒', color: T.accentText, bg: 'rgba(20,184,166,.16)' },
  jinkui: { text: '金匮', color: T.warn, bg: 'rgba(251,191,36,.16)' },
  manual: { text: '人工', color: T.kPulse, bg: 'rgba(167,139,250,.16)' }
}
const KIND_COLOR = { symptom: T.kSymptom, pulse: T.kPulse, summary: T.kSummary, formula: T.kFormula }

/* ---------------- 样式（写死深色，跟随画布主题） ---------------- */
const style = document.createElement('style')
style.textContent = `
#tcm-prov-panel{
  position:fixed;right:16px;bottom:40px;z-index:60;width:270px;
  background:${T.panel};color:${T.text};border:1px solid ${T.border};border-radius:10px;
  box-shadow:0 12px 32px rgba(0,0,0,.45);font-family:inherit;font-size:12px;
}
#tcm-prov-panel .pp-head{display:flex;align-items:center;justify-content:space-between;
  padding:8px 10px;border-bottom:1px solid ${T.border};color:${T.text2};font-size:11.5px}
#tcm-prov-panel .pp-body{padding:9px 10px;display:grid;gap:7px}
#tcm-prov-panel .pp-src{display:flex;flex-wrap:wrap;align-items:center;gap:5px;color:${T.text2};font-size:11.5px;line-height:1.5}
#tcm-prov-panel .pp-acts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#tcm-prov-panel button{
  padding:5px 0;border-radius:7px;border:1px solid ${T.borderStrong};background:${T.card};
  color:${T.text};font-size:11.5px;cursor:pointer;font-family:inherit
}
#tcm-prov-panel button:hover{background:${T.accentSoft};border-color:${T.accent}}
.pp-chip{padding:0 5px;border-radius:5px;font-size:10px;font-weight:700;line-height:16px}
.pp-empty{color:${T.text3};font-size:11px}

.tcm-modal{
  position:fixed;inset:0;z-index:200;background:rgba(4,8,12,.66);
  display:flex;align-items:center;justify-content:center;padding:20px
}
.tcm-modal .mm{
  width:min(760px,96vw);max-height:86vh;display:flex;flex-direction:column;
  background:${T.bg};color:${T.text};border:1px solid ${T.borderStrong};border-radius:12px;
  box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:inherit;font-size:12.5px
}
.tcm-modal .mm-head{display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;border-bottom:1px solid ${T.border};background:${T.panel};border-radius:12px 12px 0 0}
.tcm-modal .mm-title{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700}
.tcm-modal .mm-x{border:0;background:none;color:${T.text3};font-size:18px;cursor:pointer;line-height:1}
.tcm-modal .mm-x:hover{color:${T.text}}
.tcm-modal .mm-tabs{display:flex;gap:4px;padding:10px 16px 0}
.tcm-modal .mm-tab{padding:6px 12px;border-radius:7px 7px 0 0;border:1px solid transparent;
  background:none;color:${T.text2};cursor:pointer;font-size:12px;font-family:inherit}
.tcm-modal .mm-tab.on{background:${T.card};border-color:${T.border};color:${T.text};font-weight:600}
.tcm-modal .mm-body{padding:14px 16px;overflow:auto;display:grid;gap:12px}
.tcm-modal .kv{display:grid;grid-template-columns:72px 1fr;gap:6px;align-items:start}
.tcm-modal .kv .k{color:${T.text3};font-size:11.5px;padding-top:2px}
.tcm-modal textarea{
  width:100%;box-sizing:border-box;min-height:70px;resize:vertical;padding:8px 10px;
  background:${T.input};color:${T.text};border:1px solid ${T.borderStrong};border-radius:8px;
  font-family:inherit;font-size:12.5px;line-height:1.6
}
.tcm-modal textarea:focus{outline:none;border-color:${T.accent};box-shadow:0 0 0 2px ${T.accentSoft}}
.tcm-modal .btn{padding:6px 14px;border-radius:7px;border:1px solid ${T.borderStrong};
  background:${T.card};color:${T.text};font-size:12px;cursor:pointer;font-family:inherit}
.tcm-modal .btn.primary{background:${T.accent};border-color:${T.accent};color:#06231f;font-weight:700}
.tcm-modal .btn.primary:hover{background:#0d9c8d;border-color:#0d9c8d}
.tcm-modal .row-btns{display:flex;gap:8px;align-items:center;justify-content:flex-end}
.tcm-modal .sec-title{font-size:12px;font-weight:700;color:${T.text2};margin-top:4px}
.tcm-modal .edge{display:flex;gap:8px;padding:5px 0;border-top:1px solid ${T.border};font-size:11.5px}
.tcm-modal .edge:first-child{border-top:0}
.tcm-modal .edge .mono{color:${T.text2}}
.tcm-modal .log-item{display:grid;grid-template-columns:88px 1fr;gap:10px;padding:7px 0;
  border-top:1px solid ${T.border};font-size:11.5px;line-height:1.6}
.tcm-modal .log-item:first-child{border-top:0}
.tcm-modal .log-when{color:${T.text3};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px}
.tcm-modal .log-tag{display:inline-block;padding:0 5px;border-radius:5px;font-size:10px;
  font-weight:700;line-height:16px;margin-right:5px}
.tcm-modal .log-who{color:${T.text2}}
.tcm-modal .muted{color:${T.text3}}
`
document.head.appendChild(style)

/* ---------------- 顶部提示 ---------------- */
const banner = document.createElement('div')
banner.id = 'tcm-mode-banner'
banner.textContent = '医生模式 · 点「保存」= 提交审核（管理员通过后才入库）'
banner.style.cssText = `position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:70;
  padding:6px 14px;border-radius:999px;background:${T.accent};color:#06231f;
  font-size:12.5px;font-weight:700;box-shadow:0 8px 22px rgba(20,184,166,.35);font-family:inherit`
document.body.appendChild(banner)

/* ---------------- 常驻面板（最小信息） ---------------- */
const panel = document.createElement('div')
panel.id = 'tcm-prov-panel'
panel.innerHTML = `<div class="pp-head"><span>条文溯源</span><span id="tcm-pp-node" class="pp-empty">未选中</span></div>
  <div class="pp-body">
    <div class="pp-src" id="tcm-pp-src"><span class="pp-empty">在画布上点一个节点</span></div>
    <div class="pp-acts">
      <button data-act="trace">溯源</button>
      <button data-act="log">日志</button>
    </div>
  </div>`
document.body.appendChild(panel)

let store = null
try {
  store = await import('/canvas/js/store.js')
} catch (e) {
  console.warn('[溯源] 取不到画布 store', e)
}

const cache = new Map()
let lastNode = null

function nodeOf(name) {
  try {
    return store && store.S && store.S.nodes ? store.S.nodes.get(name) : null
  } catch (_) { return null }
}

function chip(srcId) {
  const t = SRC_TAG[srcId] || { text: '其它', color: T.text2, bg: 'rgba(255,255,255,.08)' }
  return `<span class="pp-chip" style="color:${t.color};background:${t.bg}">${esc(t.text)}</span>`
}

function renderPanel(name) {
  const nodeEl = document.getElementById('tcm-pp-node')
  const srcEl = document.getElementById('tcm-pp-src')
  if (!name) {
    nodeEl.textContent = '未选中'
    nodeEl.className = 'pp-empty'
    srcEl.innerHTML = '<span class="pp-empty">在画布上点一个节点</span>'
    return
  }
  const def = nodeOf(name)
  const p = def && def.provenance
  nodeEl.textContent = name
  nodeEl.className = ''
  nodeEl.style.color = KIND_COLOR[def && def.kind] || T.text2
  if (p) {
    const refs = (p.refs && p.refs.length) ? ' · ' + String(p.refs[0]).slice(0, 22) : ''
    srcEl.innerHTML = `${chip(p.sourceId)}<span>${esc(p.label)}${esc(refs)}</span>`
  } else {
    srcEl.innerHTML = '<span class="pp-empty">未标注出处</span>'
  }
}

async function loadHistory(name, force) {
  if (!force && cache.has(name)) return cache.get(name)
  const res = await fetch('/api/attribution/history/' + encodeURIComponent(name))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
  cache.set(name, data)
  return data
}

/* ---------------- 弹窗 ---------------- */
function openModal(name, tab) {
  const def = nodeOf(name)
  const kind = (def && def.kind) || ''
  const overlay = document.createElement('div')
  overlay.className = 'tcm-modal'
  overlay.innerHTML = `
    <div class="mm">
      <div class="mm-head">
        <div class="mm-title">
          <span style="color:${KIND_COLOR[kind] || T.text2}">●</span>${esc((def && def.title) || name)}
          <span class="muted" style="font-weight:400;font-size:11.5px">${esc(name)}</span>
        </div>
        <button class="mm-x" data-close>×</button>
      </div>
      <div class="mm-tabs">
        <button class="mm-tab ${tab === 'trace' ? 'on' : ''}" data-tab="trace">溯源</button>
        <button class="mm-tab ${tab === 'log' ? 'on' : ''}" data-tab="log">日志</button>
      </div>
      <div class="mm-body" id="tcm-mm-body"><span class="muted">读取中…</span></div>
    </div>`
  document.body.appendChild(overlay)
  const close = () => overlay.remove()
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.hasAttribute('data-close')) close()
  })
  overlay.querySelectorAll('.mm-tab').forEach(b => {
    b.onclick = () => {
      overlay.querySelectorAll('.mm-tab').forEach(x => x.classList.toggle('on', x === b))
      paint(overlay, name, b.dataset.tab)
    }
  })
  paint(overlay, name, tab)
  return overlay
}

async function paint(overlay, name, tab) {
  const body = overlay.querySelector('#tcm-mm-body')
  let data
  try {
    data = await loadHistory(name, tab === 'log')
  } catch (e) {
    body.innerHTML = `<span style="color:${T.danger}">读取失败：${esc(e.message)}</span>`
    return
  }
  const p = data.provenance || null
  if (tab === 'trace') {
    const refTxt = p && p.refs && p.refs.length ? p.refs.join('；') : '（未标注具体条文）'
    const edges = (data.edges || []).map(e => `
      <div class="edge">
        <span class="mono">${esc(e.owner)} → ${esc(e.ref)}.${esc(e.pol)}</span>
        <span class="muted" style="margin-left:auto">${e.action === 'add' ? '新增' : '删除'} · ${esc(e.author.displayName)} · ${esc(fmtDate(e.at))}</span>
      </div>`).join('') || '<div class="muted" style="padding:4px 0">还没有关系级记录（改 needs 并审核通过后开始留痕）</div>'

    body.innerHTML = `
      <div class="kv"><span class="k">出处</span><span>${p ? chip(p.sourceId) + esc(p.label) : '<span class="muted">未标注</span>'}</span></div>
      <div class="kv"><span class="k">条文</span><span style="color:${T.text2}">${esc(refTxt)}</span></div>
      <div class="kv"><span class="k">录入</span><span style="color:${T.text2}">${esc(p && p.by ? p.by : '—')}</span></div>
      <div class="kv"><span class="k">备注</span><span>
        <textarea id="tcm-note" placeholder="给后来编辑的人留一句：这条别人也遇到过、可以这样引用…">${esc(p && p.note ? p.note : '')}</textarea>
        <div class="row-btns" style="margin-top:6px">
          <span class="muted" style="margin-right:auto;font-size:11px">${esc(p && p.noteBy ? '上次：' + p.noteBy + ' · ' + (p.noteAt || '') : '')}</span>
          <button class="btn" data-act="clear">清空</button>
          <button class="btn primary" data-act="save">保存备注</button>
        </div>
      </span></div>
      <div class="sec-title">关系（这套系统里关系 = needs 的一条条件）</div>
      <div>${edges}</div>`

    body.querySelector('[data-act="save"]').onclick = () => saveNote(name, body.querySelector('#tcm-note').value, overlay)
    body.querySelector('[data-act="clear"]').onclick = () => saveNote(name, '', overlay)
  } else {
    const items = (data.log || []).map(it => {
      const color = it.type === 'draft' ? T.accentText : (it.type === 'note' ? T.warn : T.kPulse)
      return `<div class="log-item">
        <span class="log-when">${esc(fmtDate(it.at))}</span>
        <span>
          <span class="log-tag" style="color:${color};background:rgba(255,255,255,.06)">${esc(it.label)}</span>
          ${esc(it.text)}
          <div class="log-who">${esc(it.author)}${it.verified ? ' ✓' : ''}${it.extra ? ' · ' + esc(it.extra) : ''}</div>
        </span>
      </div>`
    }).join('') || '<div class="muted">还没有日志（这个节点可能是脚本/开发者直接写入的）</div>'
    body.innerHTML = `<div class="sec-title">按时间倒序 · 一次保存 = 一条</div>${items}`
  }
}

async function saveNote(name, note, overlay) {
  try {
    const res = await fetch('/api/provenance/note', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, note })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
    cache.delete(name)
    // 画布上的节点对象也跟着更新，面板立刻反映
    const def = nodeOf(name)
    if (def) def.provenance = Object.assign({}, def.provenance, { note: String(note || '').trim(), noteBy: '已保存' })
    renderPanel(name)
    await paint(overlay, name, 'log')          // 保存后直接跳到日志，能立刻看到新增的那条
    overlay.querySelectorAll('.mm-tab').forEach(x => x.classList.toggle('on', x.dataset.tab === 'log'))
  } catch (e) {
    window.alert('保存失败：' + e.message)
  }
}

panel.querySelectorAll('[data-act]').forEach(btn => {
  btn.onclick = () => {
    const name = lastNode
    if (!name) { window.alert('先在画布上点一个节点'); return }
    openModal(name, btn.dataset.act === 'log' ? 'log' : 'trace')
  }
})

/* ---------------- 跟随选中 ---------------- */
let busy = false
async function tick() {
  if (busy) return
  if (!store || !store.S || !store.S.sel) return
  const sel = [...store.S.sel]
  const name = sel.length ? sel[0] : null
  if (name === lastNode) return
  lastNode = name
  renderPanel(name)
}

if (store) {
  setInterval(tick, 400)
  tick()
}
