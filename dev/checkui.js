'use strict'
// dev/checkui.js
// 开发端前端静态体检（零依赖、纯文本分析，不需要浏览器）：
//   1) import 的符号是否真的被目标模块导出（含 import * as ns 后的 ns.xxx 用法）
//   2) getElementById('x') 用到的 id 是否存在于 index.html
//   3) index.html 引用的 css/js 文件是否存在
//   4) 各文件的 export 是否被用到（仅提示，不算失败）
//
// 用法： node dev/checkui.js

const fs = require('node:fs')
const path = require('node:path')

const JS_DIR = path.join(__dirname, 'public', 'js')
const HTML = path.join(__dirname, 'public', 'index.html')

let errors = 0
let warns = 0
function fail(msg) { errors++; console.log('  ✗ ' + msg) }
function warn(msg) { warns++; console.log('  · ' + msg) }

function read(p) { return fs.readFileSync(p, 'utf8') }

// ---------- 提取导出 ----------
function exportsOf(src) {
  const out = new Set()
  const re = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g
  let m
  while ((m = re.exec(src))) out.add(m[1])
  const re2 = /export\s*\{([^}]*)\}/g
  while ((m = re2.exec(src))) {
    m[1].split(',').forEach(part => {
      const s = part.trim()
      if (!s) return
      const as = /\s+as\s+([A-Za-z_$][\w$]*)$/.exec(s)
      out.add(as ? as[1] : s.split(/\s+/)[0])
    })
  }
  return out
}

// ---------- 提取 import ----------
function importsOf(src) {
  const named = []   // { symbols:[], from }
  const ns = []      // { alias, from }
  const re = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(src))) {
    const clause = m[1].trim()
    const from = m[2]
    if (!from.startsWith('.')) continue
    const nsMatch = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(clause)
    if (nsMatch) { ns.push({ alias: nsMatch[1], from }); continue }
    const brace = /\{([\s\S]*)\}/.exec(clause)
    if (brace) {
      const symbols = brace[1].split(',').map(s => s.trim()).filter(Boolean).map(s => {
        const as = /\s+as\s+([A-Za-z_$][\w$]*)$/.exec(s)
        return { imported: s.split(/\s+/)[0], local: as ? as[1] : s.split(/\s+/)[0] }
      })
      named.push({ symbols, from })
    }
  }
  return { named, ns }
}

// ---------- 主流程 ----------
console.log('=== 开发端前端静态体检 ===\n')

if (!fs.existsSync(JS_DIR)) { fail('找不到 dev/public/js'); process.exit(1) }
const files = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'))
const src = {}
const exp = {}
for (const f of files) {
  src[f] = read(path.join(JS_DIR, f))
  exp[f] = exportsOf(src[f])
}

console.log(`模块：${files.join(', ')}\n`)

console.log('--- 1. import / export 一致性 ---')
for (const f of files) {
  const { named, ns } = importsOf(src[f])
  for (const imp of named) {
    const target = path.basename(imp.from)
    if (!files.includes(target)) { fail(`${f} 引用了不存在的模块 ${imp.from}`); continue }
    for (const s of imp.symbols) {
      if (!exp[target].has(s.imported)) {
        fail(`${f} 从 ${target} 导入了不存在的导出：${s.imported}`)
      }
    }
  }
  for (const n of ns) {
    const target = path.basename(n.from)
    if (!files.includes(target)) { fail(`${f} 引用了不存在的模块 ${n.from}`); continue }
    // 先剥掉所有 import 语句，避免把 './api.js' 这种路径误当成成员访问
    const body = src[f].replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]/g, '')
    const used = new Set()
    const re = new RegExp('\\b' + n.alias.replace(/\$/g, '\\$') + '\\.([A-Za-z_$][\\w$]*)', 'g')
    let m
    while ((m = re.exec(body))) used.add(m[1])
    for (const u of used) {
      if (!exp[target].has(u)) fail(`${f} 使用了 ${n.alias}.${u}，但 ${target} 没有导出 ${u}`)
    }
    if (!used.size) warn(`${f} 导入了命名空间 ${n.alias}（${target}）但没用到任何成员`)
  }
}

console.log('\n--- 2. app.js 依赖的面板/检视器导出是否存在 ---')
const appSrc = src['app.js'] || ''
for (const need of [
  ['inspector.js', ['renderInspector', 'renderEdgeInspector']],
  ['panels.js', ['renderSimPanel', 'renderChainPanel', 'renderWalkPanel']]
]) {
  const [file, syms] = need
  if (!files.includes(file)) { fail(`缺少模块 ${file}`); continue }
  for (const s of syms) {
    if (!exp[file].has(s)) fail(`${file} 未导出 app.js 需要的 ${s}`)
  }
}

console.log('\n--- 3. getElementById 的 id 是否都存在于 index.html ---')
const html = read(HTML)
const ids = new Set()
let m
const reId = /\sid="([^"]+)"/g
while ((m = reId.exec(html))) ids.add(m[1])
const usedIds = new Map()
for (const f of files) {
  const re = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g
  let mm
  while ((mm = re.exec(src[f]))) {
    if (!usedIds.has(mm[1])) usedIds.set(mm[1], new Set())
    usedIds.get(mm[1]).add(f)
  }
}
// 动态创建的 id（JS 自己塞进弹窗的，不在 index.html 里）单独放行
const dynamicOk = new Set(['pd-input', 'pd-err', 'nn-kind', 'nn-name', 'nn-title', 'nn-trigger', 'nn-ask', 'nn-contra', 'nn-err', 'lp-path', 'layer-edge-labels'])
for (const [id, where] of usedIds) {
  if (dynamicOk.has(id)) continue
  if (!ids.has(id)) fail(`index.html 里没有 id="${id}"（被 ${[...where].join(', ')} 使用）`)
}

console.log('\n--- 4. index.html 引用的资源是否存在 ---')
for (const ref of ['style.css', 'js/app.js']) {
  const p = path.join(__dirname, 'public', ref)
  if (!fs.existsSync(p)) fail(`index.html 引用了不存在的 ${ref}`)
}

console.log('\n--- 5. 导出未使用提示（不影响运行）---')
for (const f of files) {
  const others = files.filter(x => x !== f).map(x => src[x]).join('\n')
  const unused = [...exp[f]].filter(s => !new RegExp('\\b' + s + '\\b').test(others) && !new RegExp('\\b' + s + '\\b').test(src[f].replace(new RegExp('export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+' + s), '')))
  if (unused.length) warn(`${f} 未被其它模块使用的导出：${unused.join(', ')}`)
}

console.log('\n============================================')
console.log(`体检结果：${errors} 个错误，${warns} 条提示`)
if (errors) {
  console.log('存在错误 → 页面会在浏览器里报错，请先修掉')
  process.exitCode = 1
} else {
  console.log('静态检查通过 ✓')
}
