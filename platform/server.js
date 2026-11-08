'use strict'
// platform/server.js
// ============================================================
// 中医辨证助手 · 云平台（零依赖，本地多用户 demo）
//
//   启动:  node platform/server.js      地址: http://127.0.0.1:3095
//
// 一个进程同时提供：
//   1) 患者端：首页 / 问诊（原 web/index.html 的问诊模块，一行未改）/ 我的辨证记录
//   2) 医生端：/canvas 就是 dev 那套可视化条文画布，保存 = 提交审核（不直接改盘）
//   3) 管理端：审核草稿（逐行 diff）、开通医生账号、看贡献榜
//   4) 社区：帖子 / 评论 / 点赞 / 医生认证徽标
//   5) 条文归属：字段级记录「哪部分条文是谁提供的」，画布上可直接看到
// ============================================================

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const { loadAll } = require('../core/loader')
const graph = require('../dev/lib/graph')
const db = require('./db')
const auth = require('./auth')
const review = require('./review')
const community = require('./community')
const { ConsultStore, historyOf, historyDetail } = require('./consult')

const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(__dirname, 'public')
const CANVAS_DIR = path.join(ROOT, 'dev', 'public')
const WEB_DIR = path.join(ROOT, 'web')
const PLUGINS_DIR = path.join(ROOT, 'plugins')

const HOST = process.env.PLATFORM_HOST || '127.0.0.1'
const PORT = Number(process.env.PLATFORM_PORT || 3095)

const { HttpError } = auth

// ------------------------------------------------------------
// 插件（诊断引擎的数据）
// ------------------------------------------------------------
let registryState = loadAll(PLUGINS_DIR)
const consultStore = new ConsultStore(registryState.registry)

function reloadPlugins() {
  registryState = loadAll(PLUGINS_DIR)
  // 已经在进行的会话继续用旧插件（引擎不会中途改判），新会话用新插件
  consultStore.registry = registryState.registry
  return Object.keys(registryState.registry).length
}

function pluginStats() {
  const byKind = registryState.byKind
  return {
    total: Object.keys(registryState.registry).length,
    symptoms: (byKind.symptom || []).length,
    pulses: (byKind.pulse || []).length,
    syndromes: (byKind.summary || []).length,
    formulas: (byKind.formula || []).length
  }
}

// ------------------------------------------------------------
// 基础工具
// ------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
}

function sendJson(res, obj, code) {
  const body = JSON.stringify(obj)
  res.writeHead(code || 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function sendText(res, text, code, type) {
  res.writeHead(code || 200, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(text)
  })
  res.end(text)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', c => {
      data += c
      if (data.length > (limit || 8e6)) { reject(new HttpError(413, '请求体过大')); req.destroy() }
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (_) { reject(new HttpError(400, '请求体不是合法 JSON')) }
    })
    req.on('error', reject)
  })
}

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return sendText(res, '未找到文件', 404)
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    res.end(data)
  })
}

function safeJoin(base, rel) {
  const file = path.join(base, decodeURIComponent(rel))
  if (!file.startsWith(base)) return null
  return file
}

// ------------------------------------------------------------
// 路由表
// ------------------------------------------------------------
const routes = []

function add(method, pattern, fn, opts = {}) {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:[A-Za-z_]+/g, m => {
    keys.push(m.slice(1))
    return '([^/]+)'
  }) + '/?$')
  routes.push({ method, re, keys, fn, opts })
}

function match(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue
    const m = r.re.exec(pathname)
    if (!m) continue
    const params = {}
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
    return { route: r, params }
  }
  return null
}

const PAGE_MAP = {
  '/': 'index.html',
  '/login': 'login.html',
  '/consult': 'consult.html',
  '/community': 'community.html',
  '/doctor': 'doctor.html',
  '/review': 'review.html',
  '/me': 'profile.html'
}

// ============================================================
// 一、账号
// ============================================================

add('POST', '/api/auth/register', ctx => {
  const out = auth.register(ctx.body)
  return { ok: true, user: out.user, needsApproval: out.needsApproval }
})

add('POST', '/api/auth/login', ctx => {
  const out = auth.login(ctx.body)
  ctx.res.setHeader('Set-Cookie', auth.cookieHeader(out.token, out.maxAge))
  return { ok: true, user: out.user }
})

add('POST', '/api/auth/logout', ctx => {
  auth.logout(auth.tokenFromReq(ctx.req))
  ctx.res.setHeader('Set-Cookie', auth.cookieHeader('', 0))
  return { ok: true }
})

add('GET', '/api/auth/me', ctx => ({
  user: ctx.user ? auth.publicUser(ctx.user) : null,
  stats: Object.assign(pluginStats(), {
    pendingDrafts: ctx.user && ctx.user.role === 'admin' ? review.pendingCount() : 0
  })
}))

add('POST', '/api/auth/profile', ctx => {
  const user = auth.requireUser(ctx.req)
  const display = String(ctx.body.displayName || '').trim()
  const bio = String(ctx.body.bio || '').slice(0, 300)
  const specialty = String(ctx.body.specialty || '').slice(0, 60)
  db.q.run('UPDATE users SET display_name = COALESCE(NULLIF(?, \'\'), display_name), bio = ?, specialty = ? WHERE id = ?',
    display, bio, specialty, user.id)
  return { ok: true, user: auth.publicUser(auth.findById(user.id)) }
})

// ============================================================
// 二、问诊（接口与原 server.js 完全一致，问诊前端一行未改）
// ============================================================

function introMessage(hasLLM) {
  return hasLLM
    ? '你好！我是中医辨证助手。请描述病人的症状（口语即可），例如：发烧、怕冷、有点咳嗽、不出汗。我会边问边帮你辨证。'
    : '你好！我是中医辨证助手。注意：当前未配置 LLM_KEY，只能做规则辨证（不能生成 AI 病情解释）。请描述病人症状开始。'
}

function newConsult(ctx) {
  const { sid, session } = consultStore.create(ctx.user ? ctx.user.id : null)
  const v = session._nextQuestionView()
  return { id: sid, ...v, hasLLM: session.hasLLM(), intro: introMessage(session.hasLLM()) }
}

add('GET', '/api/new', newConsult)
add('POST', '/api/new', newConsult)

add('POST', '/api/input', async ctx => {
  const sid = ctx.body.sid
  const r = await consultStore.input(sid, ctx.body.text || '')
  if (!r) throw new HttpError(404, '会话不存在，请刷新页面重新开始')
  if (ctx.user) consultStore.attachRecords(sid, ctx.user.id)
  return r
})

add('POST', '/api/chat', async ctx => {
  const sid = ctx.body.sid
  const r = await consultStore.chat(sid, ctx.body.text || '')
  if (!r) throw new HttpError(404, '会话不存在，请刷新页面重新开始')
  return r
})

add('GET', '/api/restart/:sid', ctx => {
  const v = consultStore.restart(ctx.params.sid)
  if (!v) throw new HttpError(404, '会话不存在，请刷新页面重新开始')
  return { id: ctx.params.sid, ...v }
})

add('GET', '/api/info', ctx => {
  const rec = consultStore.get(ctx.query.get('sid') || '')
  return {
    hasLLM: !!process.env.LLM_KEY,
    candidates: rec ? rec.session.asker.candidates().length : 0
  }
})

add('GET', '/api/plugin-status', () => ({
  running: true,
  plugins: Object.keys(registryState.registry).length,
  reloadedAt: new Date().toISOString(),
  reloads: 0,
  pid: process.pid
}))

add('GET', '/api/consult/history', ctx => {
  const user = auth.requireUser(ctx.req)
  return { items: historyOf(user.id, 30) }
})

add('GET', '/api/consult/history/:id', ctx => {
  const user = auth.requireUser(ctx.req)
  const item = historyDetail(ctx.params.id, user.id)
  if (!item) throw new HttpError(404, '记录不存在')
  return { item }
})

// ============================================================
// 三、条文画布（dev 那套 API，医生/管理员可用）
// ============================================================

add('GET', '/api/graph', () => graph.buildGraph(), { auth: 'doctor' })

add('GET', '/api/source', ctx => {
  const name = ctx.query.get('name')
  if (!name) throw new HttpError(400, '缺少 name 参数')
  return graph.readSource(name)
}, { auth: 'doctor' })

add('GET', '/api/reverse', ctx => {
  const name = ctx.query.get('name')
  if (!name) throw new HttpError(400, '缺少 name 参数')
  return graph.reverseTree(name, { maxDepth: Number(ctx.query.get('depth') || 10) })
}, { auth: 'doctor' })

add('GET', '/api/status', () => {
  const g = graph.buildGraph()
  return {
    dev: { ok: true, port: PORT, root: ROOT.replace(/\\/g, '/') },
    main: { running: true, plugins: Object.keys(registryState.registry).length, pid: process.pid },
    plugins: g.stats.total,
    stats: { dangling: g.stats.dangling.length, orphans: g.stats.orphans.length, orNodes: g.stats.orNodes, refs: g.stats.refs },
    backupsDir: graph.BACKUP_DIR.replace(/\\/g, '/')
  }
}, { auth: 'doctor' })

add('POST', '/api/simulate', ctx => graph.simulate(ctx.body.assignments || {}), { auth: 'doctor' })
add('POST', '/api/walkthrough', ctx => graph.walkthrough(ctx.body || {}), { auth: 'doctor' })
add('POST', '/api/layout', ctx => graph.saveLayout(ctx.body || {}), { auth: 'doctor' })

// 保存：管理员=直接落盘；医生=生成草稿等审核
add('POST', '/api/save', ctx => {
  const user = ctx.user
  const payload = ctx.body || {}

  if (payload.dryRun !== false) {
    const plan = graph.previewSave(payload)
    return {
      ok: plan.ok,
      errors: plan.errors,
      notes: plan.notes,
      files: (plan.files || []).map(f => ({
        relPath: f.relPath, toPath: f.toPath, kind: f.kind, node: f.node,
        diff: f.diff, changedLines: f.changedLines, notes: f.notes
      }))
    }
  }

  if (user.role === 'admin') {
    const result = graph.applySave(payload)
    if (result.ok) reloadPlugins()
    return Object.assign({}, result, { reload: { ok: !!result.ok } })
  }

  const r = review.submitDraft(user, payload)
  if (!r.ok) return r
  return {
    ok: true,
    submitted: true,
    draftId: r.id,
    meta: r.meta,
    notes: r.notes,
    written: [],
    reload: { ok: true }
  }
}, { auth: 'doctor' })

add('POST', '/api/reload-main', () => ({ ok: true, reload: { ok: true, plugins: reloadPlugins() } }), { auth: 'doctor' })

// ============================================================
// 四、审核
// ============================================================

add('GET', '/api/drafts', ctx => {
  const user = auth.requireUser(ctx.req)
  const mine = ctx.query.get('mine') === '1'
  const status = ctx.query.get('status') || (mine ? '' : 'pending')
  if (!mine && user.role !== 'admin') throw new HttpError(403, '只有管理员能看全部草稿')
  return {
    items: review.listDrafts({ status: status || undefined, authorId: mine ? user.id : undefined }),
    pending: review.pendingCount()
  }
})

add('GET', '/api/drafts/:id', ctx => {
  const user = auth.requireUser(ctx.req)
  return { draft: review.getDraft(ctx.params.id, user) }
})

add('POST', '/api/drafts/:id/approve', ctx => {
  const admin = auth.requireRole(ctx.req, ['admin'])
  const r = review.approveDraft(ctx.params.id, admin, ctx.body.note)
  if (r.ok) reloadPlugins()
  return r
})

add('POST', '/api/drafts/:id/reject', ctx => {
  const admin = auth.requireRole(ctx.req, ['admin'])
  return review.rejectDraft(ctx.params.id, admin, ctx.body.note)
})

// ============================================================
// 五、条文归属
// ============================================================

add('GET', '/api/attribution/map', ctx => {
  auth.requireUser(ctx.req)
  return { map: review.attributionMap() }
})

add('GET', '/api/attribution/node/:name', ctx => {
  auth.requireUser(ctx.req)
  return { name: ctx.params.name, items: review.attributionOf(ctx.params.name) }
})

add('GET', '/api/attribution/contributors', () => ({ items: review.contributors() }))

// ============================================================
// 六、社区
// ============================================================

add('GET', '/api/posts', ctx => ({
  tags: community.TAGS,
  items: community.listPosts({
    tag: ctx.query.get('tag') || '',
    keyword: ctx.query.get('q') || '',
    viewerId: ctx.user ? ctx.user.id : null
  })
}))

add('POST', '/api/posts', ctx => {
  const user = auth.requireUser(ctx.req)
  return { post: community.createPost(user, ctx.body) }
})

add('GET', '/api/posts/:id', ctx => ({ post: community.getPost(ctx.params.id, ctx.user ? ctx.user.id : null) }))

add('POST', '/api/posts/:id/comments', ctx => {
  const user = auth.requireUser(ctx.req)
  return { post: community.addComment(user, ctx.params.id, ctx.body.body) }
})

add('POST', '/api/posts/:id/like', ctx => {
  const user = auth.requireUser(ctx.req)
  return community.toggleLike(user, ctx.params.id)
})

add('DELETE', '/api/posts/:id', ctx => {
  const user = auth.requireUser(ctx.req)
  return community.deletePost(user, ctx.params.id)
})

// ============================================================
// 七、首页聚合 & 管理台
// ============================================================

add('GET', '/api/home', ctx => {
  const user = ctx.user
  const stats = pluginStats()
  const postCount = db.q.get('SELECT COUNT(*) AS n FROM posts').n
  const doctorCount = db.q.get('SELECT COUNT(*) AS n FROM users WHERE role = ?', 'doctor').n
  const consultCount = db.q.get("SELECT COUNT(*) AS n FROM consults").n
  return {
    stats: {
      ...stats,
      posts: postCount,
      doctors: doctorCount,
      consults: consultCount,
      pendingDrafts: user && user.role === 'admin' ? review.pendingCount() : 0
    },
    hotPosts: community.listPosts({ viewerId: user ? user.id : null, limit: 4 }),
    contributors: review.contributors().slice(0, 4),
    myConsults: user ? historyOf(user.id, 3) : []
  }
})

add('GET', '/api/admin/overview', ctx => {
  auth.requireRole(ctx.req, ['admin'])
  return {
    pendingDrafts: review.pendingCount(),
    doctors: auth.listUsers({ role: 'doctor' }),
    patients: auth.listUsers({ role: 'patient' }).slice(0, 20),
    stats: pluginStats()
  }
})

add('GET', '/api/admin/users', ctx => {
  auth.requireRole(ctx.req, ['admin'])
  return {
    items: auth.listUsers({
      role: ctx.query.get('role') || undefined,
      status: ctx.query.get('status') || undefined
    })
  }
})

add('POST', '/api/admin/users/:id/status', ctx => {
  auth.requireRole(ctx.req, ['admin'])
  const user = auth.setUserStatus(Number(ctx.params.id), ctx.body.status, ctx.body.verified)
  return { ok: true, user }
})

// ============================================================
// 八、HTTP 入口
// ============================================================

function serveCanvas(res, pathname) {
  let rel = pathname.replace(/^\/canvas\/?/, '')
  if (!rel) rel = 'index.html'
  const file = safeJoin(CANVAS_DIR, rel)
  if (!file) return sendText(res, 'forbidden', 403)
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return sendText(res, '未找到: ' + rel, 404)

  if (rel === 'index.html') {
    // 注入平台侧脚本：显示「谁提供了这部分条文」+ 提示保存=提交审核
    let html = fs.readFileSync(file, 'utf8')
    html = html.replace('<title>中医辨证助手 · 开发端（插件画布）</title>',
      '<title>条文录入 · 医生工作台</title>')
    html = html.replace('</body>', '<script type="module" src="/p/js/canvas-bridge.js"></script>\n</body>')
    return sendText(res, html, 200, MIME['.html'])
  }
  return sendFile(res, file)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname
  const method = req.method

  try {
    // ---- API ----
    if (pathname.startsWith('/api/')) {
      const hit = match(method, pathname)
      if (!hit) return sendJson(res, { ok: false, error: `未知接口 ${method} ${pathname}` }, 404)

      const ctx = {
        req, res, params: hit.params, query: url.searchParams,
        body: {}, user: auth.userFromReq(req)
      }
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') ctx.body = await readBody(req)

      const need = hit.route.opts.auth
      if (need === 'user') ctx.user = auth.requireUser(req)
      else if (need === 'doctor') ctx.user = auth.requireDoctor(req)
      else if (need === 'admin') ctx.user = auth.requireRole(req, ['admin'])

      const out = await hit.route.fn(ctx)
      return sendJson(res, out)
    }

    if (method !== 'GET' && method !== 'HEAD') return sendText(res, '方法不允许', 405)

    // ---- 问诊模块（原始 web/index.html，一行未改）----
    if (pathname === '/consult-app' || pathname === '/consult-app/') {
      return sendFile(res, path.join(WEB_DIR, 'index.html'))
    }

    // ---- 条文画布（dev/public，注入平台脚本）----
    // 注意：画布页面里用的是 ./style.css、./js/app.js 这种相对路径，
    // 所以必须以「带斜杠的目录地址」访问；/canvas 不带斜杠时浏览器会解析成
    // /style.css、/js/app.js → 404 → 页面只剩裸 HTML，按钮全部点不动。
    if (pathname === '/canvas' || pathname.startsWith('/canvas/')) {
      const user = auth.userFromReq(req)
      if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
        res.writeHead(302, { Location: '/login?next=/doctor' })
        return res.end()
      }
      if (pathname === '/canvas') {
        res.writeHead(302, { Location: '/canvas/' + (url.search || '') })
        return res.end()
      }
      return serveCanvas(res, pathname)
    }

    // ---- 页面 ----
    const page = PAGE_MAP[pathname]
    if (page) return sendFile(res, path.join(PUBLIC_DIR, page))

    // ---- 静态资源（/p/ 前缀 或 根路径兜底）----
    const relStatic = pathname.startsWith('/p/') ? pathname.slice(3) : pathname
    const staticFile = safeJoin(PUBLIC_DIR, relStatic)
    if (staticFile && fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
      return sendFile(res, staticFile)
    }

    return sendText(res, '未找到: ' + pathname, 404)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    if (status >= 500) console.error('[平台] 处理失败', method, pathname, e)
    try { sendJson(res, { ok: false, error: e.message }, status) } catch (_) {}
  }
})

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n端口 ${PORT} 已被占用。换个端口： $env:PLATFORM_PORT=3096; node platform/server.js\n`)
    process.exit(1)
  }
  throw e
})

server.listen(PORT, HOST, () => {
  const s = pluginStats()
  console.log('')
  console.log('=========================================================')
  console.log('  中医辨证助手 · 云平台（本地多用户 demo）')
  console.log(`  地址:   http://${HOST}:${PORT}`)
  console.log('---------------------------------------------------------')
  console.log(`  条文库: ${s.total} 个（症状 ${s.symptoms} / 脉象 ${s.pulses} / 证候 ${s.syndromes} / 方剂 ${s.formulas}）`)
  console.log(`  数据库: ${db.DB_PATH}`)
  console.log(`  待审:   ${review.pendingCount()} 份条文草稿`)
  console.log('---------------------------------------------------------')
  console.log('  首次使用先跑一次种子数据:  node platform/seed.js')
  console.log('  仅监听 127.0.0.1，本地 demo 用。')
  console.log('=========================================================')
  console.log('')
})

module.exports = { server }
