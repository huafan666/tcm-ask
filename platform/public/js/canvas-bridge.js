// platform/public/js/canvas-bridge.js
// ============================================================
// 由平台注入到 /canvas（dev 画布）里的溯源层。
//
// 设计（按用户几轮反馈收敛）：
//   1. 不要横幅（「医生模式 · 点保存=提交审核」已移除）
//   2. 溯源**不弹窗**：直接嵌进右侧「检视器」面板底部（出处 / 录入 / 备注 / 查看日志）
//   3. 只有「日志」才弹窗，弹窗沿用画布深色风格
//
// 不改 dev 任何源码：import 同一份 store 模块跟着选中节点走，
// 每轮把自建区块追加进 #tab-inspect（检视器自己会整块重绘，所以用轮询补挂）。
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
  warn: '#fbbf24', danger: '#f87171', kPulse: '#a78bfa'
}
const SRC_TAG = {
  shanghanlun: { text: '伤寒', color: T.accentText, bg: 'rgba(20,184,166,.16)' },
  jinkui: { text: '金匮', color: T.warn, bg: 'rgba(251,191,36,.16)' },
  manual: { text: '人工', color: T.kPulse, bg: 'rgba(167,139,250,.16)' }
}

const style = document.createElement('style')
style.textContent = `
#tcm-prov-box{border-top:1px solid ${T.border};margin-top:10px;padding:10px 2px 2px;font-family:inherit;font-size:12px;color:${T.text}}
#tcm-prov-box .pb-title{display:flex;align-items:center;justify-content:space-between;
  color:${T.text2};font-size:11.5px;margin-bottom:7px;letter-spacing:.02em}
#tcm-prov-box .pb-row{display:grid;grid-template-columns:52px 1fr;gap:6px;align-items:start;padding:2px 0;font-size:11.5px;line-height:1.6}
#tcm-prov-box .pb-k{color:${T.text3}}
#tcm-prov-box .pb-chip{padding:0 5px;border-radius:5px;font-size:10px;font-weight:700;line-height:16px}
#tcm-prov-box textarea{width:100%;box-sizing:border-box;min-height:60px;resize:vertical;padding:7px 9px;
  background:${T.input};color:${T.text};border:1px solid ${T.borderStrong};border-radius:7px;
  font-family:inherit;font-size:12px;line-height:1.55}
#tcm-prov-box textarea:focus{outline:none;border-color:${T.accent};box-shadow:0 0 0 2px ${T.accentSoft}}
#tcm-prov-box .pb-btns{display:flex;gap:6px;justify-content:flex-end;margin-top:6px;align-items:center}
#tcm-prov-box button{padding:4px 11px;border-radius:6px;border:1px solid ${T.borderStrong};
  background:${T.card};color:${T.text};font-size:11.5px;cursor:pointer;font-family:inherit}
#tcm-prov-box button:hover{background:${T.accentSoft};border-color:${T.accent}}
#tcm-prov-box button.primary{background:${T.accent};border-color:${T.accent};color:#06231f;font-weight:700}
#tcm-prov-box .pb-saved{color:${T.text3};font-size:10.5px;margin-right:auto}

.tcm-modal{position:fixed;inset:0;z-index:200;background:rgba(4,8,12,.66);
  display:flex;align-items:center;justify-content:center;padding:20px}
.tcm-modal .mm{width:min(760px,96vw);max-height:86vh;display:flex;flex-direction:column;
  background:${T.bg};color:${T.text};border:1px solid ${T.borderStrong};border-radius:12px;
  box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:inherit;font-size:12.5px}
.tcm-modal .mm-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;
  border-bottom:1px solid ${T.border};background:${T.panel};border-radius:12px 12px 0 0}
.tcm-modal .mm-title{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700}
.tcm-modal .mm-x{border:0;background:none;color:${T.text3};font-size:18px;cursor:pointer;line-height:1}
.tcm-modal .mm-x:hover{color:${T.text}}
.tcm-modal .mm-body{padding:14px 16px;overflow:auto;display:grid;gap:10px}
.tcm-modal .sec-title{font-size:12px;font-weight:700;color:${T.text2}}
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

let store = null
try {
  store = await import('/canvas/js/store.js')
} catch (e) {
  console.warn('[溯源] 取不到画布 store', e)
}

const cache = new Map()
let lastNode = null

function nodeOf(name) {
  try { return store && store.S && store.S.nodes ? store.S.nodes.get(name) : null } catch (_) { return null }
}

function chip(srcId) {
  const t = SRC_TAG[srcId] || { text: '其它', color: T.text2, bg: 'rgba(255,255,255,.08)' }
  return `<span class="pb-chip" style="color:${t.color};background:${t.bg}">${esc(t.text)}</span>`
}

/* ---------------- 嵌进检视器的溯源区块 ---------------- */
function renderInline(name) {
  const host = document.getElementById('tab-inspect')
  if (!host) return
  let box = document.getElementById('tcm-prov-box')
  const def = nodeOf(name)
  const p = def && def.provenance
  const refTxt = p && p.refs && p.refs.length ? String(p.refs[0]) : '（未标注具体条文）'

  if (!box) {
    box = document.createElement('div')
    box.id = 'tcm-prov-box'
    host.appendChild(box)
  }
  // 备注编辑中就不要重绘，免得把用户正在输的内容冲掉
  const ta = box.querySelector('#tcm-note')
  if (ta && document.activeElement === ta) return

  box.innerHTML = `
    <div class="pb-title"><span>条文溯源</span><span id="tcm-pb-log" style="color:${T.accentText};cursor:pointer">查看日志 ›</span></div>
    <div class="pb-row"><span class="pb-k">出处</span><span>${p ? chip(p.sourceId) + esc(p.label) : '<span class="muted">未标注</span>'}</span></div>
    <div class="pb-row"><span class="pb-k">条文</span><span style="color:${T.text2}">${esc(refTxt)}</span></div>
    <div class="pb-row"><span class="pb-k">录入</span><span style="color:${T.text2}">${esc(p && p.by ? p.by : '—')}</span></div>
    <div class="pb-row" style="align-items:start"><span class="pb-k">备注</span><span>
      <textarea id="tcm-note" placeholder="留一句：这条别人也遇到过、可以这样引用…">${esc(p && p.note ? p.note : '')}</textarea>
      <div class="pb-btns">
        <span class="pb-saved">${esc(p && p.noteBy ? '上次：' + p.noteBy + ' · ' + (p.noteAt || '') : '')}</span>
        <button data-pb="clear">清空</button>
        <button class="primary" data-pb="save">保存备注</button>
      </div>
    </span></div>`

  const logBtn = box.querySelector('#tcm-pb-log')
  if (logBtn) logBtn.onclick = () => openLog(name)
  const saveBtn = box.querySelector('[data-pb="save"]')
  if (saveBtn) saveBtn.onclick = () => saveNote(name, box.querySelector('#tcm-note').value)
  const clearBtn = box.querySelector('[data-pb="clear"]')
  if (clearBtn) clearBtn.onclick = () => saveNote(name, '')
}

function ensureInline(name) {
  const host = document.getElementById('tab-inspect')
  if (!host) return
  if (!host.querySelector('#tcm-prov-box')) renderInline(name)
}

async function loadHistory(name, force) {
  if (!force && cache.has(name)) return cache.get(name)
  const res = await fetch('/api/attribution/history/' + encodeURIComponent(name))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
  cache.set(name, data)
  return data
}

async function saveNote(name, note) {
  try {
    const res = await fetch('/api/provenance/note', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, note })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
    cache.delete(name)
    const def = nodeOf(name)
    if (def) def.provenance = Object.assign({}, def.provenance, { note: String(note || '').trim(), noteBy: '已保存' })
    lastNode = null           // 强制下一轮重绘
    tick()
  } catch (e) { window.alert('保存失败：' + e.message) }
}

/* ---------------- 日志弹窗（唯一保留的弹窗） ---------------- */
async function openLog(name) {
  const def = nodeOf(name)
  const overlay = document.createElement('div')
  overlay.className = 'tcm-modal'
  overlay.innerHTML = `
    <div class="mm">
      <div class="mm-head">
        <div class="mm-title">${esc((def && def.title) || name)}
          <span class="muted" style="font-weight:400;font-size:11.5px">${esc(name)} · 日志</span></div>
        <button class="mm-x" data-close>×</button>
      </div>
      <div class="mm-body"><span class="muted">读取中…</span></div>
    </div>`
  document.body.appendChild(overlay)
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.hasAttribute('data-close')) overlay.remove()
  })
  const body = overlay.querySelector('.mm-body')
  try {
    const data = await loadHistory(name, true)
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
    }).join('') || '<span class="muted">还没有日志（这个节点可能是脚本/开发者直接写入的）</span>'
    body.innerHTML = `<div class="sec-title">按时间倒序 · 一次保存 = 一条</div>${items}`
  } catch (e) {
    body.innerHTML = `<span style="color:${T.danger}">读取失败：${esc(e.message)}</span>`
  }
}

/* ---------------- 跟随选中 ---------------- */
function tick() {
  if (!store || !store.S || !store.S.sel) return
  const sel = [...store.S.sel]
  const name = sel.length ? sel[0] : null
  if (!name) {
    lastNode = null
    const box = document.getElementById('tcm-prov-box')
    if (box) box.remove()
    return
  }
  if (name === lastNode) { ensureInline(name); return }
  lastNode = name
  renderInline(name)
}

if (store) {
  setInterval(tick, 350)
  tick()
}
