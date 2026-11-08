// platform/public/js/consult.js
// 患者端问诊：把原 web/index.html 的问诊模块整块嵌进来（iframe，逻辑一行未改）
import { api } from './api.js'
import { bootShell, esc, timeAgo, toast, modal, $ } from './shell.js'

const shell = await bootShell('consult')
const user = shell.user

let history = []
if (user) {
  try { history = (await api.history()).items } catch (_) {}
}

$('#aside').innerHTML = `
  <div class="card">
    <div class="spread" style="margin-bottom:10px">
      <h3>AI 解释</h3>
      <a class="tiny dim" href="/settings">设置</a>
    </div>
    <div class="small muted" style="line-height:1.9">
      ${shell.llm && shell.llm.source === 'user'
        ? `正在用你自己的 Key <span class="mono">${esc(shell.llm.keyMask)}</span>`
        : shell.llm && shell.llm.source === 'server'
          ? '正在用服务器默认 Key'
          : '还没配置 Key：问诊照常出结论，但没有 AI 解释。'}
    </div>
  </div>
  <div class="card">
    <div class="spread" style="margin-bottom:10px">
      <h3>我的辨证记录</h3>
      ${user ? '<button class="btn btn-sm" id="btn-refresh">刷新</button>' : ''}
    </div>
    ${user
      ? (history.length
        ? '<div id="history-list">' + history.map(h => `
            <button class="list-item" data-id="${h.id}" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;padding:10px 0;border-top:1px solid var(--line-soft)">
              <div class="list-main">
                <div class="list-title">${esc(h.summary)}</div>
                <div class="list-sub">${timeAgo(h.createdAt)}${h.inputText ? ' · ' + esc(h.inputText.slice(0, 20)) : ''}</div>
              </div>
            </button>`).join('') + '</div>'
        : '<div class="small muted">还没有记录。做完一次问诊就会出现在这里。</div>')
      : '<div class="small muted">登录后，每次问诊的结论都会存进你的档案。</div><a class="btn btn-sm btn-primary" href="/login?next=/consult" style="margin-top:10px">去登录</a>'}
  </div>

  <div class="card">
    <h3 style="margin-bottom:10px">怎么回答更快收敛</h3>
    <div class="small muted" style="line-height:1.9">
      · 一次把知道的都说出来：怕冷/发热、出汗、大便、口渴、睡眠。<br>
      · 反问时只答「是 / 否 / 不清楚」，不确定就选不清楚，别猜。<br>
      · 说错了可以说「撤回」，会回到上一步。
    </div>
  </div>`

if (user) {
  const bind = () => {
    document.querySelectorAll('#history-list .list-item').forEach(btn => {
      btn.onclick = async () => {
        try {
          const { item } = await api.historyDetail(btn.dataset.id)
          modal({
            title: '辨证记录 · ' + timeAgo(item.createdAt),
            body: `
              <div class="small muted" style="margin-bottom:10px">原始描述：${esc(item.inputText || '（未记录）')}</div>
              <div class="card" style="box-shadow:none;background:#fafafa">
                <div style="font-weight:700;margin-bottom:6px">辨证倾向</div>
                <div class="small">${item.formulas.length ? item.formulas.map(f => esc(f.title)).join(' / ') : '未收敛到具体方剂'}</div>
              </div>
              <div style="margin-top:12px;font-weight:700">解释</div>
              <div class="small" style="white-space:pre-wrap;margin-top:6px">${esc(item.explanation || '（无）')}</div>
              ${item.contraindications.length ? `<div style="margin-top:12px;font-weight:700">禁忌 / 注意</div>
                <div class="small" style="margin-top:6px">${item.contraindications.map(c => '· ' + esc(c)).join('<br>')}</div>` : ''}
              <div class="hint" style="margin-top:14px">仅供学习参考，不能替代执业医师。</div>`
          })
        } catch (e) { toast(e.message, 'err') }
      }
    })
  }
  bind()
  const btn = $('#btn-refresh')
  if (btn) btn.onclick = async () => {
    try {
      history = (await api.history()).items
      location.reload()
    } catch (e) { toast(e.message, 'err') }
  }
}

$('#btn-restart-app').onclick = () => {
  const f = $('#consult-iframe')
  f.src = '/consult-app?t=' + Date.now()
  toast('已重开一次问诊')
}
