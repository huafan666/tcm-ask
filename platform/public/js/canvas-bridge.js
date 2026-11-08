// platform/public/js/canvas-bridge.js
// ============================================================
// 由平台服务注入到 /canvas 页面（dev 那套画布）里的一层壳：
//   1) 顶部横幅：提醒「保存 = 提交审核」
//   2) 右下角面板：显示当前选中节点「每个字段是谁提供的」（字段级归属）
//
// 不改 dev 的任何源码：这里直接 import 同一个 store 模块（同一 URL → 同一实例）
// ============================================================

const banner = document.createElement('div')
banner.id = 'tcm-mode-banner'
banner.textContent = '医生模式 · 点「保存」= 提交审核（管理员通过后才入库）'
document.body.appendChild(banner)

const panel = document.createElement('div')
panel.id = 'tcm-attr-panel'
panel.innerHTML = `
  <div class="tcm-attr-head">
    <span>条文提供者</span>
    <span id="tcm-attr-node" style="font-weight:400;color:#8b98a5;font-size:11px"></span>
  </div>
  <div class="tcm-attr-body" id="tcm-attr-body">
    <div class="tcm-attr-empty">在画布上选中一个节点，这里会显示它每个字段是谁提供的。</div>
  </div>`
document.body.appendChild(panel)

const esc = s => String(s === undefined || s === null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN')
}

let store = null
try {
  store = await import('/canvas/js/store.js')
} catch (e) {
  console.warn('[条文提供者] 取不到画布 store，面板停用', e)
}

const cache = new Map()
let lastNode = null

async function show(name) {
  const nodeEl = document.getElementById('tcm-attr-node')
  const bodyEl = document.getElementById('tcm-attr-body')
  nodeEl.textContent = name || ''
  if (!name) {
    bodyEl.innerHTML = '<div class="tcm-attr-empty">在画布上选中一个节点，这里会显示它每个字段是谁提供的。</div>'
    return
  }
  if (cache.has(name)) return paint(name, cache.get(name))
  bodyEl.innerHTML = '<div class="tcm-attr-empty">读取中…</div>'
  try {
    const res = await fetch('/api/attribution/node/' + encodeURIComponent(name))
    const data = await res.json()
    const items = data.items || []
    cache.set(name, items)
    paint(name, items)
  } catch (e) {
    bodyEl.innerHTML = '<div class="tcm-attr-empty">读取失败：' + esc(e.message) + '</div>'
  }
}

function paint(name, items) {
  const bodyEl = document.getElementById('tcm-attr-body')
  if (lastNode !== name) return

  // 经典原文出处（plugins/provenance.json）：伤寒论原方 / 金匮要略原方 … + 自定义说明
  let provHtml = ''
  try {
    const def = store && store.S && store.S.nodes ? store.S.nodes.get(name) : null
    const p = def && def.provenance
    if (p) {
      const refs = (p.refs && p.refs.length) ? ' 第 ' + p.refs.join('、') + ' 条' : ''
      provHtml = `<div class="tcm-attr-row" style="border-top:0;padding-bottom:4px">
        <span class="tcm-attr-field">原文出处</span>
        <span style="flex:1;min-width:0">
          <span class="tcm-attr-who" style="color:#0a7c5a">${esc(p.label)}</span>
          <span class="tcm-attr-at">${esc((p.title || '') + refs)}</span>
        </span>
      </div>`
      if (p.note) {
        provHtml += `<div style="padding:2px 0 6px;font-size:11.5px;line-height:1.55;color:#334155;
          background:#f8fafc;border-left:2px solid #cbd5e1;padding-left:8px;margin:2px 0 6px">
          ${esc(p.note)}
          <div style="color:#94a3b8;font-size:10.5px;margin-top:2px">
            ${esc(p.noteBy ? '—— ' + p.noteBy + (p.noteAt ? ' · ' + p.noteAt : '') : '')}
          </div>
        </div>`
      }
    } else {
      provHtml = `<div class="tcm-attr-row" style="border-top:0;padding-bottom:4px">
        <span class="tcm-attr-field">原文出处</span>
        <span style="flex:1;color:#8b98a5">未标注（可在 plugins/provenance.json 补）</span>
      </div>`
    }
  } catch (_) {}

  const toolbar = `<div style="display:flex;gap:6px;padding:4px 0 8px">
    <button data-tcm-act="note" data-name="${esc(name)}" style="flex:1;padding:4px 0;border:1px solid #dbe3ea;
      background:#fff;border-radius:7px;font-size:11.5px;cursor:pointer">改说明</button>
    <button data-tcm-act="history" data-name="${esc(name)}" style="flex:1;padding:4px 0;border:1px solid #dbe3ea;
      background:#fff;border-radius:7px;font-size:11.5px;cursor:pointer">编辑历史</button>
  </div>`

  if (!items.length) {
    bodyEl.innerHTML = provHtml + toolbar +
      '<div class="tcm-attr-empty">人工贡献：还没有通过审核的记录（医生提交并审核通过后出现在这里）。</div>'
  } else {
    bodyEl.innerHTML = provHtml + toolbar + items.map(it => `
      <div class="tcm-attr-row">
        <span class="tcm-attr-field">${esc(it.fieldLabel)}</span>
        <span style="flex:1;min-width:0">
          <span class="tcm-attr-who">${esc(it.author.displayName)}</span>
          ${it.author.role === 'doctor' && it.author.verified ? '<span style="color:#0074cc">✓</span>' : ''}
          <span class="tcm-attr-at"> · ${fmtDate(it.at)}</span>
        </span>
      </div>`).join('')
  }
  bindButtons(name)
}

function bindButtons(name) {
  document.querySelectorAll('#tcm-attr-panel [data-tcm-act]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.tcmAct === 'note') editNote(btn.dataset.name)
      else showHistory(btn.dataset.name)
    }
  })
}

async function editNote(name) {
  const def = store && store.S && store.S.nodes ? store.S.nodes.get(name) : null
  const cur = (def && def.provenance && def.provenance.note) || ''
  const text = window.prompt(
    '给「' + name + '」写一句说明（后来编辑的人能看到：这条别人也遇到过、可以这样引用）\n留空表示删除：', cur)
  if (text === null) return
  try {
    const res = await fetch('/api/provenance/note', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, note: text })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
    if (def) def.provenance = Object.assign({}, def.provenance, { note: text.trim(), noteBy: '已保存' })
    cache.delete(name)
    await show(name)
  } catch (e) { window.alert('保存失败：' + e.message) }
}

async function showHistory(name) {
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:20px'
  overlay.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:720px;width:100%;max-height:84vh;overflow:auto;padding:18px;font-family:-apple-system,\'Segoe UI\',\'Microsoft YaHei\',sans-serif"><div style="color:#64748b">读取中…</div></div>'
  document.body.appendChild(overlay)
  overlay.onclick = e => { if (e.target === overlay) overlay.remove() }
  const box = overlay.firstElementChild
  try {
    const res = await fetch('/api/attribution/history/' + encodeURIComponent(name))
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status))
    const p = data.provenance
    const tl = (data.timeline || []).map(t => `
      <div style="border-left:3px solid #cbd5e1;padding:6px 0 6px 10px;margin:8px 0">
        <div style="font-size:12.5px;font-weight:700">
          草稿 #${t.draftId} · ${esc(t.status)}
          <span style="font-weight:400;color:#8b98a5">· ${esc(t.author.displayName)}${t.author.verified ? ' ✓' : ''}</span>
        </div>
        <div style="font-size:11.5px;color:#475569;margin-top:2px">
          改了：${esc((t.fields || []).join('、') || '—')}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px">
          提交 ${esc(fmtDate(t.submittedAt))} · 审核 ${esc(t.reviewer || '—')} ${esc(fmtDate(t.reviewedAt))}
          ${t.reviewNote ? '· 意见：' + esc(t.reviewNote) : ''}
        </div>
      </div>`).join('') || '<div style="color:#94a3b8;font-size:12px;padding:8px 0">还没有经平台审核的编辑记录（这个节点可能是脚本/开发者直接写入的）</div>'

    const edges = (data.edges || []).map(e => `
      <div style="font-size:11.5px;padding:3px 0;border-top:1px dashed #eef2f6">
        <b>${esc(e.owner)}</b> → ${esc(e.ref)}<span style="color:#94a3b8">.${esc(e.pol)}</span>
        <span style="color:#8b98a5"> · ${e.action === 'add' ? '新增' : '删除'} · ${esc(e.author.displayName)} · ${esc(fmtDate(e.at))}</span>
        ${e.note ? `<div style="color:#475569;margin-left:10px">「${esc(e.note)}」</div>` : ''}
      </div>`).join('') || '<div style="color:#94a3b8;font-size:12px">没有关系级记录（这套系统里关系=needs 的一条条件）</div>'

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <b style="font-size:15px">${esc(name)} · 溯源</b>
        <button id="tcm-hist-close" style="border:0;background:none;font-size:18px;color:#8b98a5;cursor:pointer">×</button>
      </div>
      <div style="font-size:12px;color:#475569;line-height:1.7;background:#f8fafc;border-radius:8px;padding:8px 10px">
        出处：${esc(p ? p.label + '　' + (p.refs && p.refs[0] ? p.refs[0] : '') : '未标注')}<br>
        录入：${esc(p && p.by ? p.by : '—')}
        ${p && p.note ? '<br>说明：' + esc(p.note) : ''}
      </div>
      <div style="margin-top:14px;font-size:12px;font-weight:700;color:#0f172a">编辑历史</div>
      ${tl}
      <div style="margin-top:14px;font-size:12px;font-weight:700;color:#0f172a">关系（谁连的）</div>
      ${edges}`
    document.getElementById('tcm-hist-close').onclick = () => overlay.remove()
  } catch (e) {
    box.innerHTML = '<div style="color:#b31d43">读取失败：' + esc(e.message) + '</div>'
  }
}

function tick() {
  if (!store || !store.S || !store.S.sel) return
  const sel = [...store.S.sel]
  const name = sel.length === 1 ? sel[0] : (sel.length > 1 ? sel[0] : null)
  if (name === lastNode) return
  lastNode = name
  show(name)
}

if (store) {
  setInterval(tick, 500)
  tick()
}
