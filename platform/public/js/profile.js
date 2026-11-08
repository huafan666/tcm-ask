// platform/public/js/profile.js
// 我的：资料 / 辨证记录 / 我的帖子 / 我提供过的条文
import { api } from './api.js'
import { bootShell, esc, timeAgo, avatar, roleBadge, logout, toast, modal, $ } from './shell.js'

const shell = await bootShell('me', { requireLogin: true })
const user = shell.user

// ---------------- 资料 ----------------
$('#profile-slot').innerHTML = `
  <div class="card">
    <div class="row" style="gap:16px;align-items:flex-start">
      ${avatar(user, 'avatar-lg')}
      <div style="flex:1;min-width:0">
        <div class="row" style="gap:8px">
          <h2 style="font-size:20px">${esc(user.displayName)}</h2>
          ${roleBadge(user)}
          ${user.status === 'pending' ? '<span class="badge badge-pending">待管理员开通</span>' : ''}
        </div>
        <div class="small dim mono">@${esc(user.username)}</div>
        ${user.specialty ? `<div class="small muted" style="margin-top:4px">${esc(user.specialty)}</div>` : ''}
        ${user.bio ? `<div class="small muted" style="margin-top:6px;white-space:pre-wrap">${esc(user.bio)}</div>` : ''}
      </div>
      <button class="btn btn-sm" id="btn-edit">编辑资料</button>
    </div>
  </div>`

$('#btn-edit').onclick = () => {
  const body = document.createElement('div')
  body.innerHTML = `
    <div class="stack">
      <div class="field"><label class="label">显示名</label><input class="input" id="f-name" value="${esc(user.displayName)}"></div>
      ${user.role === 'doctor' ? `<div class="field"><label class="label">科室 / 专长</label><input class="input" id="f-spec" value="${esc(user.specialty || '')}"></div>` : ''}
      <div class="field"><label class="label">简介</label><textarea class="textarea" id="f-bio" placeholder="一句话介绍自己">${esc(user.bio || '')}</textarea></div>
    </div>`
  const m = modal({
    title: '编辑资料',
    body,
    buttons: [
      { label: '取消' },
      {
        label: '保存',
        kind: 'primary',
        onClick: async close => {
          try {
            await api.updateProfile({
              displayName: $('#f-name', m.box).value.trim(),
              bio: $('#f-bio', m.box).value.trim(),
              specialty: $('#f-spec', m.box) ? $('#f-spec', m.box).value.trim() : ''
            })
            close()
            toast('已保存', 'ok')
            setTimeout(() => location.reload(), 400)
          } catch (e) { toast(e.message, 'err') }
        }
      }
    ]
  })
}

// ---------------- 辨证记录 ----------------
let records = []
try { records = (await api.history()).items } catch (_) {}

$('#records-slot').innerHTML = `
  <div class="card" style="margin-top:16px;padding:0;overflow:hidden">
    <div class="card-head"><h3>我的辨证记录</h3><a class="tiny dim" href="/consult">去问诊</a></div>
    ${records.length ? `<div class="list">${records.map(r => `
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${esc(r.summary)}</div>
          <div class="list-sub">${timeAgo(r.createdAt)}${r.inputText ? ' · ' + esc(r.inputText.slice(0, 30)) : ''}</div>
        </div>
        <button class="btn btn-sm" data-rec="${r.id}">查看</button>
      </div>`).join('')}</div>` : '<div class="empty">还没有记录</div>'}
  </div>`

document.querySelectorAll('[data-rec]').forEach(btn => {
  btn.onclick = async () => {
    try {
      const { item } = await api.historyDetail(btn.dataset.rec)
      modal({
        title: '辨证记录 · ' + timeAgo(item.createdAt),
        body: `
          <div class="small muted">原始描述：${esc(item.inputText || '（未记录）')}</div>
          <div style="margin-top:12px;font-weight:700">辨证倾向</div>
          <div class="small">${item.formulas.length ? item.formulas.map(f => esc(f.title)).join(' / ') : '未收敛到具体方剂'}</div>
          <div style="margin-top:12px;font-weight:700">解释</div>
          <div class="small" style="white-space:pre-wrap">${esc(item.explanation || '（无）')}</div>
          ${item.contraindications.length ? `<div style="margin-top:12px;font-weight:700">禁忌 / 注意</div>
            <div class="small">${item.contraindications.map(c => '· ' + esc(c)).join('<br>')}</div>` : ''}`
      })
    } catch (e) { toast(e.message, 'err') }
  }
})

// ---------------- 我的帖子 ----------------
let myPosts = []
try {
  const all = (await api.posts()).items
  myPosts = all.filter(p => p.author.id === user.id)
} catch (_) {}

$('#posts-slot').innerHTML = `
  <div class="card" style="margin-top:16px;padding:0;overflow:hidden">
    <div class="card-head"><h3>我的帖子</h3><a class="tiny dim" href="/community">去社区</a></div>
    ${myPosts.length ? `<div class="list">${myPosts.map(p => `
      <a class="list-item" href="/community?id=${p.id}">
        <div class="list-main">
          <div class="list-title">${esc(p.title || p.body.slice(0, 30))}</div>
          <div class="list-sub">${timeAgo(p.createdAt)} · ♡ ${p.likeCount} · 💬 ${p.commentCount}</div>
        </div>
      </a>`).join('')}</div>` : '<div class="empty">还没发过帖</div>'}
  </div>`

// ---------------- 我提供过的条文 ----------------
if (user.role === 'doctor' || user.role === 'admin') {
  let map = {}
  try { map = (await api.attributionMap()).map } catch (_) {}
  const mine = Object.entries(map)
    .map(([node, fields]) => ({
      node,
      fields: Object.entries(fields).filter(([, f]) => f.displayName === user.displayName)
    }))
    .filter(x => x.fields.length)

  $('#contrib-slot').innerHTML = `
    <div class="card" style="margin-top:16px;padding:0;overflow:hidden">
      <div class="card-head"><h3>我提供过的条文</h3><span class="tiny dim">${mine.length} 个节点</span></div>
      ${mine.length ? `<div class="list">${mine.map(x => `
        <div class="list-item">
          <div class="list-main">
            <div class="list-title mono">${esc(x.node)}</div>
            <div class="list-sub">${x.fields.map(([, f]) => esc(f.fieldLabel)).join('、')}</div>
          </div>
          <span class="tiny dim">${timeAgo(x.fields[0][1].at)}</span>
        </div>`).join('')}</div>` : '<div class="empty">还没有通过审核的条文贡献</div>'}
    </div>`
}

// ---------------- 右侧栏 ----------------
$('#aside').innerHTML = `
  <div class="card">
    <h3 style="margin-bottom:10px">账号</h3>
    <div class="small muted" style="line-height:1.9">
      用户名：<span class="mono">${esc(user.username)}</span><br>
      角色：${user.role === 'doctor' ? '医生' : user.role === 'admin' ? '管理员' : '患者'}<br>
      状态：${user.status === 'active' ? '正常' : user.status === 'pending' ? '待开通' : '已停用'}<br>
      注册：${timeAgo(user.createdAt)}
    </div>
    <div class="hr"></div>
    <button class="btn btn-sm btn-danger" id="btn-logout">退出登录</button>
  </div>`

$('#btn-logout').onclick = logout
