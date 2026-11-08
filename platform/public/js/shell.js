// platform/public/js/shell.js
// 左导航 / 头像 / 时间 / toast / modal 等全站共用件
import { api } from './api.js'

export const $ = (sel, root) => (root || document).querySelector(sel)
export const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)]

export function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function timeAgo(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const d = Date.now() - t
  if (d < 60e3) return '刚刚'
  if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前'
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前'
  if (d < 7 * 86400e3) return Math.floor(d / 86400e3) + ' 天前'
  return new Date(iso).toLocaleDateString('zh-CN')
}

export function initials(name) {
  const s = String(name || '?').trim()
  return s ? s.slice(0, 1).toUpperCase() : '?'
}

export const ROLE_LABEL = { patient: '患者', doctor: '医生', admin: '管理员' }

export function roleBadge(user) {
  if (!user) return ''
  if (user.role === 'admin') return '<span class="badge badge-admin">管理员</span>'
  if (user.role === 'doctor') {
    return user.verified
      ? '<span class="badge badge-verified">✓ 已认证医生</span>'
      : '<span class="badge badge-doctor">医生（待认证）</span>'
  }
  return '<span class="badge badge-soft">患者</span>'
}

export function avatar(user, cls) {
  const size = cls || ''
  const ring = user && user.role === 'doctor' && user.verified ? 'avatar-ring' : ''
  const inner = `<div class="avatar ${size}">${esc(initials(user && user.displayName))}</div>`
  return ring ? `<div class="${ring}">${inner}</div>` : inner
}

// ---------------- toast ----------------
let toastHost = null
export function toast(msg, kind, ms) {
  if (!toastHost) {
    toastHost = document.createElement('div')
    toastHost.className = 'toast-host'
    document.body.appendChild(toastHost)
  }
  const el = document.createElement('div')
  el.className = 'toast' + (kind ? ' ' + kind : '')
  el.textContent = msg
  toastHost.appendChild(el)
  setTimeout(() => el.remove(), ms || 3200)
}

// ---------------- modal ----------------
export function modal({ title, body, buttons }) {
  const host = document.createElement('div')
  host.className = 'modal-host'
  const box = document.createElement('div')
  box.className = 'modal'
  box.innerHTML = `<h3>${esc(title || '')}</h3><div class="modal-body"></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px;gap:8px"></div>`
  const bodyEl = $('.modal-body', box)
  if (typeof body === 'string') bodyEl.innerHTML = body
  else if (body) bodyEl.appendChild(body)
  const btnRow = $('.row', box)
  const close = () => host.remove()
  for (const b of (buttons || [{ label: '关闭' }])) {
    const btn = document.createElement('button')
    btn.className = 'btn ' + (b.kind === 'primary' ? 'btn-primary' : b.kind === 'danger' ? 'btn-danger' : '')
    btn.textContent = b.label
    btn.onclick = () => { if (b.onClick) b.onClick(close); else close() }
    btnRow.appendChild(btn)
  }
  host.appendChild(box)
  host.addEventListener('click', e => { if (e.target === host) close() })
  document.body.appendChild(host)
  return { close, box }
}

// ---------------- 图标 ----------------
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  consult: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 8.5h7M8.5 11.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  community: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12.5c1.2 1.6 2.6 2.4 4 2.4s2.8-.8 4-2.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  doctor: '<path d="M12 3v4M10 5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 9h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12v5M9.5 14.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  review: '<path d="M5 4h11l3 3v13H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11h8M8 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  me: '<circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.3 13.6a7.7 7.7 0 0 0 0-3.2l1.6-1.1-1.8-3.1-1.9.7a7.7 7.7 0 0 0-2.7-1.6L14.1 3.4h-3.6l-.4 1.9a7.7 7.7 0 0 0-2.7 1.6l-1.9-.7-1.8 3.1 1.6 1.1a7.7 7.7 0 0 0 0 3.2l-1.6 1.1 1.8 3.1 1.9-.7a7.7 7.7 0 0 0 2.7 1.6l.4 1.9h3.6l.4-1.9a7.7 7.7 0 0 0 2.7-1.6l1.9.7 1.8-3.1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  heart: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  comment: '<path d="M20 12a7.5 7.5 0 0 1-11.3 6.6L5 20l1.4-3.7A7.5 7.5 0 1 1 20 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  chart: '<path d="M4 19h16M7 16V9M12 16V5M17 16v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
}

export function icon(name, size) {
  return `<span class="nav-ico" ${size ? `style="width:${size}px;height:${size}px"` : ''}>
    <svg viewBox="0 0 24 24" width="${size || 22}" height="${size || 22}" fill="none">${I[name] || ''}</svg>
  </span>`
}

// ---------------- 导航 ----------------
function navItems(user) {
  const items = [
    { key: 'home', href: '/', label: '首页', ico: 'home' },
    { key: 'consult', href: '/consult', label: '问诊', ico: 'consult' },
    { key: 'community', href: '/community', label: '社区', ico: 'community' }
  ]
  if (user && (user.role === 'doctor' || user.role === 'admin')) {
    items.push({ key: 'doctor', href: '/doctor', label: '条文工作台', ico: 'doctor' })
  }
  if (user && user.role === 'admin') {
    items.push({ key: 'review', href: '/review', label: '审核台', ico: 'review' })
  }
  items.push({ key: 'me', href: user ? '/me' : '/login', label: user ? '我的' : '登录', ico: 'me' })
  if (user) items.push({ key: 'settings', href: '/settings', label: '设置', ico: 'gear' })
  return items
}

/** 渲染左导航；返回 { user, stats } */
export async function bootShell(activeKey, opts = {}) {
  const host = document.getElementById('sidebar')
  let me = { user: null, stats: {} }
  try { me = await api.me() } catch (_) {}
  const user = me.user

  if (opts.requireLogin && !user) {
    location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search)
    return new Promise(() => {})
  }
  if (opts.requireRole && user && !opts.requireRole.includes(user.role)) {
    document.body.innerHTML = '<div class="auth-wrap"><div class="auth-card"><h2>没有权限</h2>' +
      '<p class="muted">这个页面需要' + (opts.requireRole.includes('admin') ? '管理员' : '医生') + '账号。</p>' +
      '<a class="btn btn-primary" href="/" style="margin-top:14px">回首页</a></div></div>'
    return new Promise(() => {})
  }
  if (opts.requireRole && !user) {
    location.href = '/login?next=' + encodeURIComponent(location.pathname)
    return new Promise(() => {})
  }

  if (host) {
    host.innerHTML = `
      <a class="brand" href="/">
        <span class="brand-mark"></span>
        <span>
          <span class="brand-name">辨证社区</span>
          <span class="brand-sub">TCM ASK</span>
        </span>
      </a>
      <nav class="nav">
        ${navItems(user).map(it => `
          <a class="nav-item ${it.key === activeKey ? 'active' : ''}" href="${it.href}">
            ${icon(it.ico)}<span class="nav-label">${it.label}</span>
            ${it.key === 'review' && me.stats && me.stats.pendingDrafts ? `<span class="nav-badge">${me.stats.pendingDrafts}</span>` : ''}
          </a>`).join('')}
      </nav>
      <button class="nav-cta" id="nav-cta">开始问诊</button>
      ${user ? `
        <a class="nav-user" href="/me">
          ${avatar(user, 'avatar-sm')}
          <span class="nav-user-meta">
            <span class="nav-user-name">${esc(user.displayName)}</span>
            <span class="nav-user-role">${ROLE_LABEL[user.role] || ''}${user.status === 'pending' ? ' · 待开通' : ''}</span>
          </span>
        </a>` : `
        <a class="nav-user" href="/login">
          <div class="avatar avatar-sm">?</div>
          <span class="nav-user-meta">
            <span class="nav-user-name">未登录</span>
            <span class="nav-user-role">点这里登录 / 注册</span>
          </span>
        </a>`}
    `
    const cta = document.getElementById('nav-cta')
    if (cta) cta.onclick = () => { location.href = '/consult' }
  }

  return { user, stats: me.stats || {}, llm: me.llm || null }
}

export function logout() {
  api.logout().then(() => { location.href = '/' }).catch(() => { location.href = '/' })
}

export function pendingBadge(n) {
  return n ? `<span class="badge badge-pending">待审 ${n}</span>` : ''
}
