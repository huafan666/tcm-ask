// server.js
// 本地中医辨证 Web 服务器：起 HTTP 服务，提供聊天前端 + 辨证 API。
// 双击 start.bat → node server.js → 自动打开浏览器。
const http = require('http')
const fs = require('fs')
const path = require('path')

require(path.join(__dirname, 'loadEnv'))      // 载入 .env（LLM_KEY）
const { loadAll, watchPlugins } = require(path.join(__dirname, 'core/loader'))
const { Session } = require(path.join(__dirname, 'core/session'))

const HOST = '127.0.0.1'
const PORT = Number(process.env.PORT || 3088)
const pluginsRoot = path.join(__dirname, 'plugins')
const webRoot = path.join(__dirname, 'web')

console.log('正在装载中医辨证插件…')
let registry = loadAll(pluginsRoot).registry
let pluginStat = { count: Object.keys(registry).length, reloadedAt: new Date().toISOString(), reloads: 0 }
console.log('已装载插件对象：', pluginStat.count)

// 插件热重载：开发端保存后自动生效（也可手动 POST /api/dev/reload）
function reloadPlugins(reason) {
  try {
    const next = loadAll(pluginsRoot)
    registry = next.registry
    pluginStat = {
      count: Object.keys(registry).length,
      reloadedAt: new Date().toISOString(),
      reloads: pluginStat.reloads + 1,
      reason: reason || 'watch'
    }
    console.log(`[热重载] 插件已重新载入：${pluginStat.count} 个对象（${pluginStat.reason}）`)
    return pluginStat
  } catch (e) {
    console.error('[热重载] 失败，继续沿用旧插件:', e.message)
    return { error: e.message, count: pluginStat.count }
  }
}
try {
  watchPlugins(pluginsRoot, loadAll).on('change', () => reloadPlugins('watch'))
  console.log('插件热重载已启用（改动 plugins/*.js 后自动生效）')
} catch (e) {
  console.error('插件热重载启用失败:', e.message)
}

// ---------- 会话管理 ----------
const sessions = new Map()
function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, new Session(registry))
  }
  return sessions.get(id)
}

// ---------- 静态文件服务 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
}

function serveStatic(req, res, pathname) {
  let file = path.join(webRoot, pathname === '/' ? 'index.html' : pathname)
  // 防止路径穿越
  if (!file.startsWith(webRoot)) { res.writeHead(403); res.end('forbidden'); return }
  fs.readFile(file, (err, data) => {
    if (err) {
      // 未匹配则回退到 index.html(单页)
      fs.readFile(path.join(webRoot, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); res.end('not found'); return }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      })
      return
    }
    const ext = path.extname(file).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

// ---------- body 读取 ----------
function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy() })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch (_) { resolve({}) } })
  })
}

function sendJson(res, obj) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(obj))
}

// ---------- API ----------
async function handleApi(req, res, url, body) {
  const parts = url.pathname.split('/').filter(Boolean)   // ['api', 'xxx']

  // /api/plugin-status → 插件版本信息（供开发端显示「主服务已重载」）
  if (parts[1] === 'plugin-status') {
    sendJson(res, { running: true, plugins: pluginStat.count, reloadedAt: pluginStat.reloadedAt, reloads: pluginStat.reloads, pid: process.pid })
    return
  }

  // /api/dev/reload → 开发端保存后强制立即重载（仅本机可访问）
  if (parts[1] === 'dev' && parts[2] === 'reload') {
    const st = reloadPlugins('dev')
    sendJson(res, { ok: !st.error, plugins: st.count, reloadedAt: st.reloadedAt, reloads: st.reloads, error: st.error })
    return
  }

  // /api/new → 新会话
  if (parts[1] === 'new') {
    const id = makeId()
    sessions.set(id, new Session(registry))
    const s = sessions.get(id)
    const v = s._nextQuestionView()
    sendJson(res, { id, ...v, hasLLM: s.hasLLM(), intro: introMessage(s.hasLLM()) })
    return
  }

  const sid = parts[2] || body.sid || ''
  const s = sessions.get(sid)
  if (!s) { sendJson(res, { error: '会话不存在，请刷新页面重新开始' }); return }

  if (parts[1] === 'input') {
    const text = body.text || ''
    const r = await s.input(text)
    sendJson(res, r)
    return
  }

  if (parts[1] === 'chat') {
    const r = await s.chat(body.text || '')
    sendJson(res, r)
    return
  }

  if (parts[1] === 'restart') {
    sendJson(res, { id: sid, ...s.restart() })
    return
  }

  if (parts[1] === 'info') {
    sendJson(res, { hasLLM: s.hasLLM(), candidates: s.asker.candidates().length })
    return
  }

  sendJson(res, { error: '未知接口' })
}

function makeId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function introMessage(hasLLM) {
  return hasLLM
    ? '你好！我是中医辨证助手。请描述病人的症状（口语即可），例如：发烧、怕冷、有点咳嗽、不出汗。我会边问边帮你辨证。'
    : '你好！我是中医辨证助手。注意：当前未配置 LLM_KEY，只能做规则辨证（不能生成 AI 病情解释）。请描述病人症状开始。'
}

// ---------- 启动 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'POST') {
        const body = await readBody(req)
        await handleApi(req, res, url, body)
      } else if (req.method === 'GET') {
        await handleApi(req, res, url, {})
      }
      return
    }
    if (req.method === 'GET') {
      serveStatic(req, res, url.pathname)
      return
    }
    res.writeHead(405); res.end()
  } catch (e) {
    console.error('服务器错误:', e)
    try { sendJson(res, { error: '服务器内部错误: ' + e.message }) } catch (_) {}
  }
})

server.listen(PORT, HOST, () => {
  console.log('')
  console.log('==============================================')
  console.log('  中医辨证系统 已启动')
  console.log(`  地址: http://${HOST}:${PORT}`)
  console.log(`  LLM: ${process.env.LLM_KEY ? '已配置 ✓' : '未配置（仅规则辨证）'}`)
  console.log('  关闭：直接关掉本窗口即可')
  console.log('==============================================')
})
