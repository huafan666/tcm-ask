// platform/public/js/home.js
// 首页：核心功能前置（问诊 / 社区 / 工作台）+ 热帖 + 贡献榜
import { api } from './api.js'
import { bootShell, esc, timeAgo, avatar, roleBadge, toast, $ } from './shell.js'

const shell = await bootShell('home')
const user = shell.user

let data = {
  stats: {}, hotPosts: [], contributors: [], myConsults: []
}
try { data = await api.home() } catch (e) { toast(e.message, 'err') }

const s = data.stats || {}
const isDoctor = user && (user.role === 'doctor' || user.role === 'admin')

// ---------------- hero ----------------
$('#hero-slot').innerHTML = `
  <section class="hero">
    <div class="hero-inner">
      <h1>说说你的不舒服<br>我陪你把《伤寒论》的条文一条条理清</h1>
      <p>基于 262 条结构化条文做三态推理：先问几句关键的话，再给出辨证倾向、方剂与禁忌。
        每条条文由认证医生录入、管理员审核，来源可追溯。</p>
      <div class="hero-actions">
        <a class="btn btn-grad btn-lg" href="/consult">开始问诊</a>
        <a class="btn btn-lg" href="/community">逛逛社区</a>
        ${isDoctor ? '<a class="btn btn-lg" href="/doctor">条文工作台</a>' : ''}
        ${!user ? '<a class="btn btn-lg" href="/login">登录 / 注册</a>' : ''}
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-n">${s.total || 0}</div><div class="stat-l">条文节点</div></div>
        <div class="stat"><div class="stat-n">${s.formulas || 0}</div><div class="stat-l">方剂</div></div>
        <div class="stat"><div class="stat-n">${s.doctors || 0}</div><div class="stat-l">认证医生</div></div>
        <div class="stat"><div class="stat-n">${s.consults || 0}</div><div class="stat-l">累计问诊</div></div>
      </div>
    </div>
  </section>`

// ---------------- 核心功能 ----------------
const features = [
  { href: '/consult', title: '问诊辨证', desc: '口语描述症状，边问边辨证，出方剂与禁忌', ico: 'consult' },
  { href: '/community', title: '条文社区', desc: '讨论条文、贴医案，医生带认证徽标', ico: 'community' },
  isDoctor
    ? { href: '/doctor', title: '条文工作台', desc: '在画布上改条文，提交后由管理员审核入库', ico: 'doctor' }
    : { href: user ? '/me' : '/login', title: '我的记录', desc: '历次辨证结论与建议，随时回看', ico: 'me' }
]
if (user && user.role === 'admin') {
  features.push({ href: '/review', title: '审核台', desc: `待审 ${s.pendingDrafts || 0} 份条文草稿，逐行 diff 后放行`, ico: 'review' })
}

$('#feature-slot').innerHTML = `
  <div class="card" style="margin-top:16px">
    <div class="spread" style="margin-bottom:14px">
      <h3>核心功能</h3>
      <span class="tiny dim">${user ? esc(user.displayName) + ' · ' + (user.role === 'patient' ? '患者' : user.role === 'doctor' ? '医生' : '管理员') : '未登录也可问诊'}</span>
    </div>
    <div class="feature-grid">
      ${features.map(f => `
        <a class="feature" href="${f.href}">
          <div class="feature-ico">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">${
              f.ico === 'consult' ? '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
              : f.ico === 'community' ? '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 12.5c1.2 1.6 2.6 2.4 4 2.4s2.8-.8 4-2.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
              : f.ico === 'doctor' ? '<path d="M12 3v4M10 5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="9" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M12 12.5v4M10 14.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
              : f.ico === 'review' ? '<path d="M5 4h11l3 3v13H5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11h8M8 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
              : '<circle cx="12" cy="8.5" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
            }</svg>
          </div>
          <h4>${esc(f.title)}</h4>
          <p>${esc(f.desc)}</p>
        </a>`).join('')}
    </div>
  </div>`

// ---------------- 社区热帖 ----------------
const posts = data.hotPosts || []
$('#feed-slot').innerHTML = `
  <div class="card" style="margin-top:16px">
    <div class="spread" style="margin-bottom:14px">
      <h3>社区最新</h3>
      <a class="btn btn-sm" href="/community">全部讨论</a>
    </div>
    ${posts.length ? posts.map(p => `
      <a class="post" href="/community?id=${p.id}" style="display:block;margin-bottom:12px">
        <div class="post-head">
          ${avatar(p.author, 'avatar-sm')}
          <div>
            <div class="post-author">${esc(p.author.displayName)} ${roleBadge(p.author)}</div>
            <div class="post-time">${timeAgo(p.createdAt)} · ${esc(p.tag)}</div>
          </div>
        </div>
        ${p.title ? `<div class="post-title">${esc(p.title)}</div>` : ''}
        <div class="post-body">${esc(p.body.slice(0, 180))}${p.body.length > 180 ? '…' : ''}</div>
        <div class="post-actions">
          <span class="icon-btn">♡ ${p.likeCount}</span>
          <span class="icon-btn">💬 ${p.commentCount}</span>
        </div>
      </a>`).join('') : '<div class="empty">还没有讨论，去社区开第一帖吧</div>'}
  </div>`

// ---------------- 右侧栏 ----------------
const contributors = data.contributors || []
$('#aside').innerHTML = `
  <div class="card">
    <div class="spread" style="margin-bottom:12px">
      <h3>我的辨证记录</h3>
      <a class="tiny dim" href="/me">全部</a>
    </div>
    ${user
      ? ((data.myConsults || []).length
        ? (data.myConsults || []).map(c => `
            <div class="list-item" style="padding:10px 0;border-top:1px solid var(--line-soft)">
              <div class="list-main">
                <div class="list-title">${esc(c.summary)}</div>
                <div class="list-sub">${timeAgo(c.createdAt)}${c.inputText ? ' · ' + esc(c.inputText.slice(0, 18)) : ''}</div>
              </div>
            </div>`).join('')
        : '<div class="small muted">还没有记录。做完一次问诊就会出现在这里。</div>')
      : '<div class="small muted">登录后可以保存每次问诊的结论。<br><a class="btn btn-sm btn-primary" href="/login" style="margin-top:10px">去登录</a></div>'}
  </div>

  <div class="card">
    <div class="spread" style="margin-bottom:12px">
      <h3>条文贡献榜</h3>
      <span class="tiny dim">谁提供了哪部分条文</span>
    </div>
    ${contributors.length ? contributors.map(c => `
      <div class="row" style="padding:8px 0">
        ${avatar({ displayName: c.display_name, role: c.role, verified: c.verified }, 'avatar-sm')}
        <div style="flex:1;min-width:0">
          <div class="small" style="font-weight:700">${esc(c.display_name)} ${c.role === 'doctor' && c.verified ? '<span class="badge badge-verified">✓</span>' : ''}</div>
          <div class="tiny dim">${c.nodes} 条条文 · ${c.fields} 个字段</div>
        </div>
      </div>`).join('') : '<div class="small muted">还没有医生提交条文。审核通过后这里会出现贡献者。</div>'}
  </div>

  <div class="card">
    <div class="tiny dim" style="line-height:1.8">
      本平台仅用于《伤寒论》条文推演与软件工程实践。<br>
      任何辨证结论都不能替代执业医师。
    </div>
  </div>`
