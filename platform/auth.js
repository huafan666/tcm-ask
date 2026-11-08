'use strict'
// platform/auth.js
// ============================================================
// 账号与会话：scrypt 口令哈希 + HttpOnly Cookie 会话（零依赖，只用 node:crypto）
//
//   角色：patient 患者 / doctor 医生 / admin 管理员
//   状态：active 正常 / pending 待管理员开通（医生注册后默认）/ blocked 停用
// ============================================================

const crypto = require('node:crypto')
const { q, now } = require('./db')

const COOKIE_NAME = 'tcm_token'
const SESSION_DAYS = 7
const ROLES = ['patient', 'doctor', 'admin']

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// ---------- 口令 ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, hash] = parts
  const calc = crypto.scryptSync(String(password), salt, 64)
  const want = Buffer.from(hash, 'hex')
  if (want.length !== calc.length) return false
  return crypto.timingSafeEqual(calc, want)
}

// ---------- Cookie ----------
function parseCookies(req) {
  const out = {}
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function cookieHeader(token, maxAgeSeconds) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
}

// ---------- 用户 ----------
function publicUser(u) {
  if (!u) return null
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: u.role,
    status: u.status,
    bio: u.bio,
    specialty: u.specialty,
    verified: !!u.verified,
    createdAt: u.created_at
  }
}

function findByUsername(username) {
  return q.get('SELECT * FROM users WHERE username = ?', String(username || '').trim().toLowerCase())
}

function findById(id) {
  return q.get('SELECT * FROM users WHERE id = ?', Number(id))
}

function register({ username, password, displayName, role, specialty, bio }) {
  const name = String(username || '').trim().toLowerCase()
  const pass = String(password || '')
  const display = String(displayName || '').trim() || name
  const wantRole = ROLES.includes(role) ? role : 'patient'

  if (!/^[a-z0-9_]{3,24}$/.test(name)) throw new HttpError(400, '用户名需 3-24 位小写字母/数字/下划线')
  if (pass.length < 6) throw new HttpError(400, '密码至少 6 位')
  if (wantRole === 'admin') throw new HttpError(403, '管理员账号只能由后台开通，不能自助注册')
  if (findByUsername(name)) throw new HttpError(409, '用户名已被占用')

  const status = wantRole === 'doctor' ? 'pending' : 'active'
  const res = q.run(
    `INSERT INTO users (username, display_name, role, status, password_hash, bio, specialty, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    name, display, wantRole, status, hashPassword(pass), String(bio || ''), String(specialty || ''), now()
  )
  const user = findById(Number(res.lastInsertRowid))
  return { user: publicUser(user), needsApproval: status === 'pending' }
}

function login({ username, password }) {
  const user = findByUsername(username)
  if (!user || !verifyPassword(password, user.password_hash)) throw new HttpError(401, '用户名或密码不正确')
  if (user.status === 'blocked') throw new HttpError(403, '账号已被停用，请联系管理员')
  const token = crypto.randomBytes(24).toString('hex')
  const created = now()
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString()
  q.run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    token, user.id, created, expires)
  return { token, user: publicUser(user), maxAge: SESSION_DAYS * 86400 }
}

function logout(token) {
  if (token) q.run('DELETE FROM sessions WHERE token = ?', token)
}

/** 从请求里取当前用户（未登录返回 null；过期的会话顺手删掉） */
function userFromReq(req) {
  const token = parseCookies(req)[COOKIE_NAME]
  if (!token) return null
  const row = q.get('SELECT * FROM sessions WHERE token = ?', token)
  if (!row) return null
  if (row.expires_at < now()) { q.run('DELETE FROM sessions WHERE token = ?', token); return null }
  const user = findById(row.user_id)
  if (!user || user.status === 'blocked') return null
  return user
}

function tokenFromReq(req) {
  return parseCookies(req)[COOKIE_NAME] || ''
}

function requireUser(req) {
  const u = userFromReq(req)
  if (!u) throw new HttpError(401, '请先登录')
  return u
}

function requireRole(req, roles) {
  const u = requireUser(req)
  if (!roles.includes(u.role)) throw new HttpError(403, '当前账号没有这个权限')
  return u
}

/** 医生提交条文需要「已开通」的医生账号 */
function requireDoctor(req) {
  const u = requireRole(req, ['doctor', 'admin'])
  if (u.role === 'doctor' && u.status !== 'active') throw new HttpError(403, '医生账号还在等待管理员开通')
  return u
}

// ---------- 管理员：账号管理 ----------
function listUsers({ role, status } = {}) {
  const where = []
  const params = []
  if (role) { where.push('role = ?'); params.push(role) }
  if (status) { where.push('status = ?'); params.push(status) }
  const sql = 'SELECT * FROM users' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY id DESC'
  return q.all(sql, ...params).map(publicUser)
}

function setUserStatus(userId, status, verified) {
  if (!['active', 'pending', 'blocked'].includes(status)) throw new HttpError(400, '状态不合法')
  const u = findById(userId)
  if (!u) throw new HttpError(404, '用户不存在')
  if (u.role === 'admin') throw new HttpError(403, '不能修改管理员账号状态')
  q.run('UPDATE users SET status = ?, verified = ? WHERE id = ?',
    status, verified === undefined ? u.verified : (verified ? 1 : 0), userId)
  return publicUser(findById(userId))
}

function createAdmin({ username, password, displayName }) {
  const name = String(username).trim().toLowerCase()
  if (findByUsername(name)) return null
  const res = q.run(
    `INSERT INTO users (username, display_name, role, status, password_hash, bio, specialty, verified, created_at)
     VALUES (?, ?, 'admin', 'active', ?, '', '', 1, ?)`,
    name, displayName || name, hashPassword(password), now()
  )
  return publicUser(findById(Number(res.lastInsertRowid)))
}

module.exports = {
  HttpError,
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  parseCookies,
  cookieHeader,
  publicUser,
  findById,
  findByUsername,
  register,
  login,
  logout,
  userFromReq,
  tokenFromReq,
  requireUser,
  requireRole,
  requireDoctor,
  listUsers,
  setUserStatus,
  createAdmin
}
