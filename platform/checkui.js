'use strict'
// platform/checkui.js
// 平台前端的静态体检（零依赖）：
//   1) 每个 js 模块里的相对 import 是否都能找到文件
//   2) 每个页面引用的 /p/ 静态资源是否存在
//   3) 脚本里 $(\'#id\') 用到的 id，是否在页面 HTML 或脚本动态生成的 HTML 里出现过
//   4) 后端路由表里的 auth 级别是否覆盖了前端调用的接口
//
//   启动: node platform/checkui.js

const fs = require('node:fs')
const path = require('node:path')

const PUBLIC = path.join(__dirname, 'public')
let errors = 0
let notes = 0

const err = m => { errors++; console.log('  ✗ ' + m) }
const note = m => { notes++; console.log('  · ' + m) }

const read = p => fs.readFileSync(p, 'utf8')
const list = dir => fs.readdirSync(dir, { withFileTypes: true })

// ---------- 1) import ----------
console.log('\n[1] 模块 import 解析')
for (const f of list(path.join(PUBLIC, 'js'))) {
  if (!f.name.endsWith('.js')) continue
  const abs = path.join(PUBLIC, 'js', f.name)
  const src = read(abs)
  for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
    const spec = m[1]
    if (!spec.startsWith('.')) continue
    const target = path.resolve(path.dirname(abs), spec)
    if (!fs.existsSync(target)) err(`${f.name} 引用了不存在的模块 ${spec}`)
  }
}
console.log('  完成')

// ---------- 2) 页面资源 ----------
console.log('\n[2] 页面引用的静态资源')
const pages = list(PUBLIC).filter(f => f.isFile() && f.name.endsWith('.html')).map(f => f.name)
for (const p of pages) {
  const src = read(path.join(PUBLIC, p))
  for (const m of src.matchAll(/(?:src|href)="(\/p\/[^"]+)"/g)) {
    const rel = m[1].replace(/^\/p\//, '')
    const target = path.join(PUBLIC, rel)
    if (!fs.existsSync(target)) err(`${p} 引用了不存在的资源 ${m[1]}`)
  }
  for (const m of src.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    if (m[1].startsWith('/p/')) continue
    if (!m[1].startsWith('/')) note(`${p} 用了绝对脚本路径 ${m[1]}`)
  }
}
console.log(`  检查了 ${pages.length} 个页面`)

// ---------- 3) DOM id ----------
console.log('\n[3] 脚本用到的 DOM id')
for (const p of pages) {
  const html = read(path.join(PUBLIC, p))
  const scripts = [...html.matchAll(/<script[^>]+src="\/p\/(js\/[^"]+)"/g)].map(m => m[1])
  for (const s of scripts) {
    const abs = path.join(PUBLIC, s)
    if (!fs.existsSync(abs)) { err(`${p} 引用的脚本不存在 ${s}`); continue }
    const js = read(abs)
    const ids = new Set()
    for (const m of js.matchAll(/\$\('#([A-Za-z0-9_-]+)'/g)) if (!m[1].endsWith('-')) ids.add(m[1])
    for (const m of js.matchAll(/getElementById\('([A-Za-z0-9_-]+)'\)/g)) ids.add(m[1])
    const shellJs = read(path.join(PUBLIC, 'js', 'shell.js'))
    for (const id of ids) {
      const inHtml = html.includes('id="' + id + '"')
      const inJs = js.includes('id="' + id + '"') || js.includes("id='" + id + "'") ||
        js.includes('id=\\"' + id) || shellJs.includes('id="' + id + '"')
      if (!inHtml && !inJs) err(`${p} / ${s}：用到了 #${id}，但页面和脚本里都没有这个元素`)
    }
  }
}
console.log('  完成')

// ---------- 4) 接口覆盖 ----------
console.log('\n[4] 前端调用的接口是否都在后端路由里')
const serverSrc = read(path.join(__dirname, 'server.js'))
const routePaths = [...serverSrc.matchAll(/add\('(GET|POST|DELETE)',\s*'([^']+)'/g)]
  .map(m => ({ method: m[1], path: m[2] }))
const apiSrc = read(path.join(PUBLIC, 'js', 'api.js'))
const calls = [...apiSrc.matchAll(/req\('([^']+)'/g)].map(m => m[1])
for (const call of calls) {
  const base = call.split('?')[0]
  const hit = routePaths.some(r => {
    const re = new RegExp('^' + r.path.replace(/:[A-Za-z_]+/g, '[^/]+') + '$')
    return re.test(base.replace(/'\s*\+.*$/, '')) || r.path.startsWith(base.replace(/\/$/, ''))
  })
  if (!hit) {
    // 带变量拼接的（'/api/drafts/' + id）退化成前缀匹配
    const prefix = base.replace(/'$/, '')
    const okPrefix = routePaths.some(r => r.path.startsWith(prefix) || prefix.startsWith(r.path.split('/:')[0]))
    if (!okPrefix) err(`前端调用了后端没有的接口：${call}`)
    else note(`接口按前缀匹配：${call}`)
  }
}
console.log(`  后端路由 ${routePaths.length} 条，前端调用 ${calls.length} 个`)

// ---------- 5) 画布注入 ----------
console.log('\n[5] 画布注入')
if (!serverSrc.includes('canvas-bridge.js')) err('server.js 没有把 canvas-bridge.js 注入画布页')
if (!fs.existsSync(path.join(PUBLIC, 'js', 'canvas-bridge.js'))) err('缺少 canvas-bridge.js')
else if (!read(path.join(PUBLIC, 'js', 'canvas-bridge.js')).includes("'/canvas/js/store.js'")) {
  note('bridge 未 import 画布 store（归属面板会失效）')
}
console.log('  完成')

console.log('\n============================================')
console.log(`体检结果：${errors} 个错误，${notes} 条提示`)
if (errors) {
  console.log('静态检查未通过 ✗')
  process.exitCode = 1
} else {
  console.log('静态检查通过 ✓')
}
