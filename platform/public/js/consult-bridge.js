// platform/public/js/consult-bridge.js
// ============================================================
// 由平台注入到问诊页（原 web/index.html）里的桥脚本：
//   辨证一收敛（/api/input 返回 result），就在页面右下角弹出「触发链条」面板，
//   把命中的三元组摊开，并逐个标出这个节点出自哪本书哪一条、是谁录入的。
//
// 不动原问诊页面一行代码：只包一层 fetch 观察响应，然后在 body 里加一个自己的面板。
// ============================================================

const esc = s => String(s === undefined || s === null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SRC_TAG = {
  shanghanlun: { text: '伤寒', color: '#0f766e', bg: '#ccfbf1' },
  jinkui: { text: '金匮', color: '#92400e', bg: '#fef3c7' },
  manual: { text: '人工', color: '#6d28d9', bg: '#ede9fe' }
}

let panel = null
let lastSid = null

function ensurePanel() {
  if (panel && document.body.contains(panel)) return panel
  panel = document.createElement('div')
  panel.id = 'tcm-chain-panel'
  panel.innerHTML = ''
  document.body.appendChild(panel)
  return panel
}

function tag(srcId, label) {
  const t = SRC_TAG[srcId] || { text: '其它', color: '#475569', bg: '#f1f5f9' }
  return `<span style="display:inline-block;padding:0 5px;border-radius:5px;font-size:10px;font-weight:700;
    line-height:16px;color:${t.color};background:${t.bg};margin-right:4px">${esc(t.text)}</span>`
}

function condLine(c, node) {
  const mark = c.satisfied ? '✓' : (c.state === 'no' ? '✗' : '?')
  const color = c.satisfied ? '#0a7c5a' : (c.state === 'no' ? '#b31d43' : '#8b98a5')
  const p = node && node.provenance
  const src = p ? tag(p.sourceIdFromLabel || sourceIdOf(p), p.label) : ''
  const ref = p && p.refs && p.refs.length ? esc(String(p.refs[0]).slice(0, 26)) : ''
  const who = p && p.by && !String(p.by).startsWith('system:') ? '录入 ' + esc(p.by) : ''
  const contrib = (node && node.contributors || [])
    .filter(x => x.field !== 'node')
    .slice(0, 2)
    .map(x => esc(x.fieldLabel) + '：' + esc(x.displayName))
    .join(' · ')
  const meta = [ref, who, contrib].filter(Boolean).join(' · ')
  return `<div style="display:flex;gap:6px;padding:3px 0;font-size:11.5px;line-height:1.5">
    <span style="color:${color};flex:0 0 10px">${mark}</span>
    <span style="flex:0 0 auto;font-weight:600">${esc(c.title)}</span>
    <span style="flex:1;min-width:0;color:#64748b">${src}${meta}</span>
  </div>`
}

// provenance 里没有 sourceId 时，用 label 兜底判断来源
function sourceIdOf(p) {
  if (!p) return ''
  if (/伤寒/.test(p.label || '')) return 'shanghanlun'
  if (/金匮/.test(p.label || '')) return 'jinkui'
  if (/人工/.test(p.label || '')) return 'manual'
  return ''
}

function render(chain) {
  const host = ensurePanel()
  if (!chain || !chain.targets || !chain.targets.length) {
    host.innerHTML = ''
    return
  }
  const blocks = chain.targets.map(t => {
    const rows = t.path.map(c => condLine(c, chain.nodes[c.name])).join('')
    const label = t.pathTotal > 1 ? `三元组 ${t.pathIndex + 1} / 共 ${t.pathTotal} 条` : '三元组'
    return `<div style="margin-top:8px;border-top:1px dashed #e2e8f0;padding-top:6px">
      <div style="font-weight:700;font-size:12.5px;color:#0f172a">
        ${esc(t.title)}
        <span style="font-weight:400;color:#8b98a5;font-size:11px"> · ${esc(label)} · 全部满足</span>
      </div>
      ${rows}
    </div>`
  }).join('')

  host.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <b style="font-size:13px">触发链条 · 谁录入的</b>
      <button id="tcm-chain-close" style="border:0;background:none;cursor:pointer;font-size:16px;color:#8b98a5">×</button>
    </div>
    <div style="font-size:11px;color:#8b98a5;line-height:1.5">
      把结论是怎么推出来的摊开：每条三元组内部全部满足才成立；来源标签是「出自哪本书」，后面是录入人。
    </div>
    ${blocks}
    <div style="margin-top:8px;font-size:10.5px;color:#94a3b8">仅供学习参考，不能替代执业医师。</div>`
  const btn = document.getElementById('tcm-chain-close')
  if (btn) btn.onclick = () => { host.innerHTML = '' }
}

async function fetchChain(sid) {
  try {
    const url = '/api/consult/chain' + (sid ? '?sid=' + encodeURIComponent(sid) : '')
    const res = await window.__tcmOrigFetch(url)
    if (!res.ok) return
    const data = await res.json()
    if (data && data.chain) render(data.chain)
  } catch (_) {}
}

// ---- 粗筛提示：不再右上角弹窗（用户说太突兀），改成**贴在聊天里那一问的气泡下面**一行小字 ----
// 只在当前问题是「系统闸门 / 部位大类粗筛」时出现，并附上「答不是可以一次排除整类」的说明。
function pickGroupQuestion(data) {
  if (!data) return ''
  const view = data.view || data
  const q = view && view.question
  if (!q || !(q.isGroup || q.isSystem)) return ''
  const n = (q.covers && q.covers.length) || 0
  const range = n ? '（覆盖 ' + n + ' 个具体症状）' : ''
  const label = q.isSystem ? ('按「' + (q.systemTitle || q.title) + '」这一整类先粗筛') : '按部位/大类先粗筛'
  return '· ' + label + range + '，答「不是」可以一次排除一整类'
}

/** 把提示挂到最近一条助手气泡下面（不额外占一条消息、不浮在页面上） */
function attachInlineHint(text) {
  const thread = document.getElementById('thread')
  if (!thread) return
  // 先清掉旧的提示
  thread.querySelectorAll('.tcm-inline-hint').forEach(el => el.remove())
  if (!text) return
  const rows = thread.querySelectorAll('.row.assistant')
  if (!rows.length) return
  const last = rows[rows.length - 1]
  const bubble = last.querySelector('.bubble')
  if (!bubble) return
  const hint = document.createElement('div')
  hint.className = 'tcm-inline-hint'
  hint.style.cssText = 'margin-top:6px;padding-top:5px;border-top:1px dashed #e2e8f0;' +
    'font-size:11px;line-height:1.5;color:#9aa7b4;font-family:inherit'
  hint.textContent = text
  bubble.appendChild(hint)
}

// ---- 包一层 fetch，盯 /api/input 的结论 ----
window.__tcmOrigFetch = window.__tcmOrigFetch || window.fetch.bind(window)
window.fetch = async function (...args) {
  const res = await window.__tcmOrigFetch(...args)
  try {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || ''
    if (url.includes('/api/input') || url.includes('/api/chat')) {
      let sid = null
      try { sid = JSON.parse(args[1].body || '{}').sid || null } catch (_) {}
      if (sid) lastSid = sid
      const data = await res.clone().json()
      const hint = pickGroupQuestion(data && data.result ? data.result : data)
      // 页面自己的渲染在后面，延后一点点再挂提示
      setTimeout(() => attachInlineHint(hint), 80)
      if (data && data.result) fetchChain(sid || lastSid)
    } else if (/\/api\/(consult\/new|restart)/.test(url)) {
      try {
        const d = await res.clone().json()
        const hint = pickGroupQuestion(d)
        setTimeout(() => attachInlineHint(hint), 80)
      } catch (_) {}
    }
  } catch (_) {}
  return res
}

// 面板样式（自带，不依赖问诊页的 CSS）
const style = document.createElement('style')
style.textContent = `
#tcm-chain-panel{
  position:fixed;right:16px;bottom:16px;z-index:80;width:330px;max-height:52vh;overflow:auto;
  background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-radius:14px;
  box-shadow:0 12px 30px rgba(15,23,42,.18);padding:12px 14px;
  font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
}
#tcm-chain-panel:empty{display:none}
@media (max-width:780px){#tcm-chain-panel{left:12px;right:12px;width:auto;bottom:12px;max-height:44vh}}
`
document.head.appendChild(style)
