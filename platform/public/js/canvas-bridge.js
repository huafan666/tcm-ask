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

  // 经典原文出处（plugins/provenance.json）：伤寒论原方 / 金匮要略原方 …
  let provHtml = ''
  try {
    const def = store && store.S && store.S.nodes ? store.S.nodes.get(name) : null
    const p = def && def.provenance
    if (p) {
      const refs = (p.refs && p.refs.length) ? ' 第 ' + p.refs.join('、') + ' 条' : ''
      provHtml = `<div class="tcm-attr-row" style="border-top:0;padding-bottom:6px">
        <span class="tcm-attr-field">原文出处</span>
        <span style="flex:1;min-width:0">
          <span class="tcm-attr-who" style="color:#0a7c5a">${esc(p.label)}</span>
          <span class="tcm-attr-at">${esc((p.title || '') + refs)}</span>
        </span>
      </div>`
    } else {
      provHtml = `<div class="tcm-attr-row" style="border-top:0;padding-bottom:6px">
        <span class="tcm-attr-field">原文出处</span>
        <span style="flex:1;color:#8b98a5">未标注（可在 plugins/provenance.json 补）</span>
      </div>`
    }
  } catch (_) {}

  if (!items.length) {
    bodyEl.innerHTML = provHtml + '<div class="tcm-attr-empty">人工贡献：还没有通过审核的记录（医生提交并审核通过后出现在这里）。</div>'
    return
  }
  bodyEl.innerHTML = provHtml + items.map(it => `
    <div class="tcm-attr-row">
      <span class="tcm-attr-field">${esc(it.fieldLabel)}</span>
      <span style="flex:1;min-width:0">
        <span class="tcm-attr-who">${esc(it.author.displayName)}</span>
        ${it.author.role === 'doctor' && it.author.verified ? '<span style="color:#0074cc">✓</span>' : ''}
        <span class="tcm-attr-at"> · ${fmtDate(it.at)}</span>
      </span>
    </div>`).join('')
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
