// platform/public/js/review.js
// 管理员审核台：草稿 diff → 通过/驳回；医生账号开通；贡献榜
import { api } from './api.js'
import { bootShell, esc, timeAgo, avatar, roleBadge, toast, modal, $, $$ } from './shell.js'

await bootShell('review', { requireRole: ['admin'] })

let state = { drafts: [], doctors: [], board: [] }

async function load() {
  const [d, o, c] = await Promise.all([
    api.drafts('?status=pending'),
    api.overview(),
    api.contributors()
  ])
  state.drafts = d.items
  state.doctors = o.doctors
  state.board = c.items
  render()
}

function render() {
  $('#n-drafts').textContent = state.drafts.length ? `(${state.drafts.length})` : ''
  const pendingDoctors = state.doctors.filter(d => d.status === 'pending')
  $('#n-doctors').textContent = pendingDoctors.length ? `(${pendingDoctors.length})` : ''

  // ---- 草稿 ----
  $('#panel-drafts').innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-head"><h3>待审条文草稿</h3><span class="tiny dim">点「审阅」看逐行 diff</span></div>
      ${state.drafts.length ? `<div class="list">${state.drafts.map(d => `
        <div class="list-item">
          ${avatar(d.author, 'avatar-sm')}
          <div class="list-main">
            <div class="list-title">${esc(d.title)}</div>
            <div class="list-sub">${esc(d.author.displayName)} ${d.author.verified ? '<span class="badge badge-verified">✓</span>' : ''}
              · ${timeAgo(d.createdAt)} · ${esc(d.summary)}</div>
          </div>
          <button class="btn btn-sm btn-primary" data-review="${d.id}">审阅</button>
        </div>`).join('')}</div>` : '<div class="empty">没有待审草稿</div>'}
    </div>`

  $$('[data-review]').forEach(btn => { btn.onclick = () => openDraft(btn.dataset.review) })

  // ---- 医生账号 ----
  $('#panel-doctors').innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-head"><h3>医生账号</h3><span class="tiny dim">开通后该医生才能提交条文</span></div>
      ${state.doctors.length ? `<div class="list">${state.doctors.map(d => `
        <div class="list-item">
          ${avatar(d, 'avatar-sm')}
          <div class="list-main">
            <div class="list-title">${esc(d.displayName)} <span class="tiny dim mono">@${esc(d.username)}</span>
              ${d.verified ? '<span class="badge badge-verified">✓ 已认证</span>' : '<span class="badge badge-soft">未认证</span>'}
              ${d.status === 'pending' ? '<span class="badge badge-pending">待开通</span>' : d.status === 'blocked' ? '<span class="badge badge-no">已停用</span>' : '<span class="badge badge-ok">正常</span>'}
            </div>
            <div class="list-sub">${esc(d.specialty || '未填专长')} · 注册于 ${timeAgo(d.createdAt)}</div>
          </div>
          <div class="row" style="gap:6px">
            ${d.status !== 'active' ? `<button class="btn btn-sm btn-primary" data-act="active" data-id="${d.id}">开通</button>` : ''}
            ${d.status === 'active' ? `<button class="btn btn-sm" data-act="blocked" data-id="${d.id}">停用</button>` : ''}
            <button class="btn btn-sm ${d.verified ? '' : 'btn-primary'}" data-verify="${d.id}">${d.verified ? '取消认证' : '认证'}</button>
          </div>
        </div>`).join('')}</div>` : '<div class="empty">还没有医生注册</div>'}
    </div>`

  $$('[data-act]').forEach(btn => {
    btn.onclick = async () => {
      try {
        await api.setUserStatus(btn.dataset.id, { status: btn.dataset.act })
        toast('已更新', 'ok')
        await load()
      } catch (e) { toast(e.message, 'err') }
    }
  })
  $$('[data-verify]').forEach(btn => {
    btn.onclick = async () => {
      const doc = state.doctors.find(d => String(d.id) === btn.dataset.verify)
      try {
        await api.setUserStatus(btn.dataset.verify, { status: doc.status, verified: !doc.verified })
        toast('已更新认证状态', 'ok')
        await load()
      } catch (e) { toast(e.message, 'err') }
    }
  })

  // ---- 贡献榜 ----
  $('#panel-board').innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-head"><h3>条文贡献榜</h3><span class="tiny dim">谁提供了多少条文的多少个字段</span></div>
      ${state.board.length ? `<div class="list">${state.board.map((c, i) => `
        <div class="list-item">
          <span class="tiny dim" style="width:20px">${i + 1}</span>
          ${avatar({ displayName: c.display_name, role: c.role, verified: c.verified }, 'avatar-sm')}
          <div class="list-main">
            <div class="list-title">${esc(c.display_name)} ${roleBadge({ role: c.role, verified: c.verified })}</div>
            <div class="list-sub">${c.nodes} 条条文 · ${c.fields} 个字段 · 最近 ${timeAgo(c.last_at)}</div>
          </div>
        </div>`).join('')}</div>` : '<div class="empty">还没有审核通过的条文</div>'}
    </div>`

  $('#aside').innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:10px">审核要点</h3>
      <div class="small muted" style="line-height:1.9">
        · 看 diff 里的 <span class="mono">trigger</span> 是否会误命中别的症状；<br>
        · <span class="mono">ask</span> 是否是「是不是」开头的单问句；<br>
        · <span class="mono">needs</span> 路径是否自相矛盾；<br>
        · 通过后会自动写盘 + 引擎热重载 + 登记归属。
      </div>
    </div>`
}

async function openDraft(id) {
  let draft
  try { draft = (await api.draft(id)).draft } catch (e) { toast(e.message, 'err'); return }

  const filesHtml = (draft.files || []).map(f => {
    const adds = (f.diff || []).filter(d => d.t === '+').length
    const dels = (f.diff || []).filter(d => d.t === '-').length
    const lines = (f.diff || []).map(d => {
      const cls = d.t === '+' ? 'dl-add' : d.t === '-' ? 'dl-del' : 'dl-ctx'
      return `<span class="${cls}">${esc(d.t === ' ' ? '  ' + d.s : d.t + ' ' + d.s)}</span>`
    }).join('')
    return `<div class="diff-file">
      <div class="diff-head"><span>${esc(f.relPath)}</span><span>+${adds} −${dels}</span></div>
      <pre class="diff-body">${lines}</pre>
    </div>`
  }).join('')

  const body = document.createElement('div')
  body.innerHTML = `
    <div class="row-wrap" style="margin-bottom:10px">
      ${avatar(draft.author, 'avatar-sm')}
      <b>${esc(draft.author.displayName)}</b>${roleBadge(draft.author)}
      <span class="tiny dim">${timeAgo(draft.createdAt)}</span>
    </div>
    <div class="small muted" style="margin-bottom:6px">影响：${esc(draft.summary)}</div>
    <div class="small" style="margin-bottom:10px">
      ${(draft.items || []).map(i => `<span class="badge badge-soft" style="margin:2px">${esc(i.name)} · ${esc(i.fieldLabel)}</span>`).join('')}
    </div>
    ${draft.errors && draft.errors.length ? `<div class="badge badge-no">校验问题：${draft.errors.map(esc).join('；')}</div>` : ''}
    ${filesHtml || '<div class="small muted">没有文件改动</div>'}
    <div class="field" style="margin-top:14px">
      <label class="label">审核意见（驳回必填）</label>
      <textarea class="textarea" id="review-note" placeholder="例如：触发词「呕」太宽，会命中所有呕吐类症状，请收窄"></textarea>
    </div>`

  const m = modal({
    title: '审阅草稿 #' + draft.id + ' · ' + draft.title,
    body,
    buttons: [
      { label: '关闭' },
      {
        label: '驳回',
        kind: 'danger',
        onClick: async close => {
          const note = $('#review-note', m.box).value.trim()
          if (!note) { toast('驳回请写明原因', 'warn'); return }
          try { await api.reject(draft.id, note); close(); toast('已驳回', 'ok'); await load() } catch (e) { toast(e.message, 'err') }
        }
      },
      {
        label: '通过并入库',
        kind: 'primary',
        onClick: async close => {
          const note = $('#review-note', m.box).value.trim()
          try {
            const r = await api.approve(draft.id, note)
            if (!r.ok) { toast('落盘失败：' + (r.errors || []).join('；'), 'err', 8000); return }
            close()
            toast(`已入库 ${(r.written || []).length} 个文件 · 登记 ${r.attributionCount} 条归属`, 'ok', 5000)
            await load()
          } catch (e) { toast(e.message, 'err') }
        }
      }
    ]
  })
}

$$('#tabs .tag').forEach(t => {
  t.onclick = () => {
    $$('#tabs .tag').forEach(x => x.classList.toggle('active', x === t))
    for (const k of ['drafts', 'doctors', 'board']) {
      $('#panel-' + k).classList.toggle('hidden', k !== t.dataset.tab)
    }
  }
})

$('#btn-reload').onclick = () => load().then(() => toast('已刷新', 'ok')).catch(e => toast(e.message, 'err'))

await load()
