'use strict'
// dev/server.js
// ============================================================
// 中医辨证助手 · 开发端服务器（零依赖，仅本机）
//
//   启动:  node dev/server.js        （或双击 dev/启动开发端.bat）
//   地址:  http://127.0.0.1:3090
//
// 只监听 127.0.0.1，永远不会进入 dist 打包（打包脚本只复制明确的文件清单）。
// 所有写操作都被限制在 plugins/ 下的 .js 文件，且写盘前会先做一次「临时目录
// 编译验证」，语法/重名/悬空引用全过才允许落盘。
// ============================================================

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const graph = require('./lib/graph')

const HOST = '127.0.0.1'
const PORT = Number(process.env.DEV_PORT || 3090)
const MAIN_PORT = Number(process.env.MAIN_PORT || process.env.PORT || 3088)
const PUBLIC_DIR = path.join(__dirname, 'public')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
}

// ------------------------------------------------------------
// 基础
// ------------------------------------------------------------

function sendJson(res, obj, code) {
  const body = JSON.stringify(obj)
  res.writeHead(code || 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', c => {
      data += c
      if (data.length > (limit || 4e6)) { reject(new Error('请求体过大')); req.destroy() }
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (e) { reject(new Error('请求体不是合法 JSON: ' + e.message)) }
    })
    req.on('error', reject)
  })
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname)
  const file = path.join(PUBLIC_DIR, rel)
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('forbidden'); return }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('未找到: ' + rel)
      return
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    res.end(data)
  })
}

/** 探测主服务（3088）是否在跑、插件版本是否一致 */
function probeMain() {
  return new Promise(resolve => {
    const req = http.request(
      { host: '127.0.0.1', port: MAIN_PORT, path: '/api/plugin-status', method: 'GET', timeout: 1500 },
      r => {
        let d = ''
        r.on('data', c => { d += c })
        r.on('end', () => {
          try { resolve(Object.assign({ running: true }, JSON.parse(d))) }
          catch (_) { resolve({ running: true, parseError: true }) }
        })
      }
    )
    req.on('error', () => resolve({ running: false }))
    req.on('timeout', () => { req.destroy(); resolve({ running: false, timeout: true }) })
    req.end()
  })
}

/** 通知主服务立刻重载插件 */
function notifyMainReload() {
  return new Promise(resolve => {
    const req = http.request(
      { host: '127.0.0.1', port: MAIN_PORT, path: '/api/dev/reload', method: 'POST', timeout: 4000 },
      r => {
        let d = ''
        r.on('data', c => { d += c })
        r.on('end', () => {
          try { resolve(Object.assign({ ok: r.statusCode === 200 }, JSON.parse(d))) }
          catch (_) { resolve({ ok: r.statusCode === 200, raw: d }) }
        })
      }
    )
    req.on('error', e => resolve({ ok: false, error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: '主服务响应超时' }) })
    req.end()
  })
}

// ------------------------------------------------------------
// 路由
// ------------------------------------------------------------

const api = {
  'GET /api/graph': async () => graph.buildGraph(),

  'GET /api/source': async (req, res, url) => {
    const name = url.searchParams.get('name')
    if (!name) return { ok: false, error: '缺少 name 参数' }
    return graph.readSource(name)
  },

  'GET /api/reverse': async (req, res, url) => {
    const name = url.searchParams.get('name')
    if (!name) return { ok: false, error: '缺少 name 参数' }
    const maxDepth = Number(url.searchParams.get('depth') || 10)
    return graph.reverseTree(name, { maxDepth })
  },

  'GET /api/status': async () => {
    const main = await probeMain()
    const g = graph.buildGraph()
    return {
      dev: { ok: true, port: PORT, root: graph.ROOT.replace(/\\/g, '/') },
      main,
      plugins: g.stats.total,
      stats: { dangling: g.stats.dangling.length, orphans: g.stats.orphans.length, orNodes: g.stats.orNodes, refs: g.stats.refs },
      backupsDir: graph.BACKUP_DIR.replace(/\\/g, '/')
    }
  },

  'POST /api/simulate': async (req, res, url, body) => graph.simulate(body.assignments || {}),

  'POST /api/walkthrough': async (req, res, url, body) => graph.walkthrough(body || {}),

  'POST /api/layout': async (req, res, url, body) => graph.saveLayout(body || {}),

  'POST /api/save': async (req, res, url, body) => {
    if (body.dryRun !== false) {
      const plan = graph.previewSave(body)
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
    const result = graph.applySave(body)
    let reload = null
    if (result.ok && body.reloadMain !== false) reload = await notifyMainReload()
    return Object.assign({}, result, { reload })
  },

  'POST /api/reload-main': async () => ({ ok: true, reload: await notifyMainReload() })
}

// ------------------------------------------------------------
// 启动
// ------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const key = req.method + ' ' + url.pathname

  try {
    const handler = api[key]
    if (handler) {
      const body = req.method === 'POST' ? await readBody(req) : {}
      const out = await handler(req, res, url, body)
      sendJson(res, out)
      return
    }
    if (url.pathname.startsWith('/api/')) {
      sendJson(res, { ok: false, error: '未知接口: ' + key }, 404)
      return
    }
    if (req.method === 'GET') { serveStatic(req, res, url.pathname); return }
    res.writeHead(405); res.end()
  } catch (e) {
    console.error('[开发端] 处理失败', key, e)
    try { sendJson(res, { ok: false, error: e.message, stack: String(e.stack || '').split('\n').slice(0, 4) }, 500) } catch (_) {}
  }
})

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error('')
    console.error(`端口 ${PORT} 已被占用：开发端可能已经在运行了。`)
    console.error(`请先关掉那个窗口，或换个端口： set DEV_PORT=3091 && node dev/server.js`)
    console.error('')
    process.exit(1)
  }
  throw e
})

// 启动时的安全体检（只读，不写任何东西）
const g = graph.buildGraph()
server.listen(PORT, HOST, () => {
  console.log('')
  console.log('=========================================================')
  console.log('  中医辨证助手 · 开发端（插件画布）')
  console.log(`  地址:   http://${HOST}:${PORT}`)
  console.log(`  主服务: http://${HOST}:${MAIN_PORT}  （保存后会自动通知它重载）`)
  console.log('---------------------------------------------------------')
  console.log(`  插件:   ${g.stats.total} 个（症状 ${g.stats.byKind.symptom} / 脉象 ${g.stats.byKind.pulse} / 证候 ${g.stats.byKind.summary} / 方剂 ${g.stats.byKind.formula}）`)
  console.log(`  引用:   ${g.stats.refs} 条（其中 .no 否定 ${g.stats.noConds} 条），多路径 OR 节点 ${g.stats.orNodes} 个`)
  console.log(`  体检:   悬空引用 ${g.stats.dangling.length} 处，未被引用的症状/脉象 ${g.stats.orphans.length} 个`)
  console.log(`  源码:   ${graph.PLUGINS.replace(/\\/g, '/')}`)
  console.log(`  备份:   ${graph.BACKUP_DIR.replace(/\\/g, '/')}\\<时间戳>\\`)
  console.log('---------------------------------------------------------')
  console.log('  仅监听 127.0.0.1，不会进入 dist 打包。')
  console.log('  关闭：直接关掉本窗口即可')
  console.log('=========================================================')
  console.log('')
  probeMain().then(m => {
    console.log(m.running
      ? `  [主服务] 正在运行，已载入 ${m.plugins || '?'} 个插件 —— 保存后会自动热重载`
      : '  [主服务] 未运行（不影响编辑；启动主服务后保存仍会自动重载）')
    console.log('')
  })
})
