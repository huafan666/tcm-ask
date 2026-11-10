'use strict'
// tools/fix-missing-kind.js
//
// 发现的问题：core/loader.js 有 `mod.kind = mod.kind || 'symptom'`，
// 所以 plugins/formulas/ 里凡是漏写 kind 的文件，都会被当成 kind:'symptom' 注册。
// 这会让「症状统计」「症状归族」把方剂当成症状，也会污染反问流程。
//
// 本工具：给 formulas/ 下缺 kind 的文件补上 kind:'formula'（syndromes/ 同理补 summary）。
// 另：删除明确无意义的垃圾节点（title 为单个名词、无 trigger 无 needs 无 kind）。
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const DIRS = [
  { dir: 'formulas', kind: 'formula' },
  { dir: 'syndromes', kind: 'summary' },
  { dir: 'pulses', kind: 'pulse' }
]

const fixes = []
for (const { dir, kind } of DIRS) {
  const d = path.join(PLUGINS, dir)
  if (!fs.existsSync(d)) continue
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.js')) continue
    const p = path.join(d, f)
    const src = fs.readFileSync(p, 'utf8')
    if (/^\s*kind\s*:/m.test(src)) continue
    fixes.push({ file: f, dir, kind, p })
  }
}

console.log('=== 缺 kind 的文件 ===')
console.log('共 ' + fixes.length + ' 个')
for (const x of fixes) console.log('  ' + x.dir + '/' + x.file + '  → 补 kind: ' + x.kind)

// 垃圾节点：只有 name + title，别的什么都没有
const junk = []
const sd = path.join(PLUGINS, 'symptoms')
for (const f of fs.readdirSync(sd)) {
  if (!f.endsWith('.js')) continue
  const src = fs.readFileSync(path.join(sd, f), 'utf8')
  const hasTrigger = /\btrigger\s*[:(]/.test(src)
  const hasNeeds = /\bneeds\s*:/.test(src)
  const m = /title:\s*'([^']*)'/.exec(src)
  const title = m ? m[1] : ''
  if (!hasTrigger && !hasNeeds && title.length <= 2) junk.push({ file: f, title })
}
console.log('\n=== 疑似垃圾节点（无 trigger / 无 needs / 标题≤2字）===')
if (!junk.length) console.log('  无')
for (const j of junk) console.log('  symptoms/' + j.file + '  「' + j.title + '」')

if (!WRITE) {
  console.log('\n（预览，加 --write 落库）')
  process.exit(0)
}

for (const x of fixes) {
  let src = fs.readFileSync(x.p, 'utf8')
  // 插在 title 行之后
  src = src.replace(/^(\s*title\s*:\s*'[^']*',\n)/m, "$1  kind: '" + x.kind + "',\n")
  if (!/^\s*kind\s*:/m.test(src)) {
    // 没 title 行就在 name 行后插
    src = src.replace(/^(\s*name\s*:\s*'[^']*',\n)/m, "$1  kind: '" + x.kind + "',\n")
  }
  fs.writeFileSync(x.p, src, 'utf8')
  console.log('  ~ ' + x.dir + '/' + x.file + ' 已补 kind: ' + x.kind)
}

for (const j of junk) {
  fs.unlinkSync(path.join(sd, j.file))
  console.log('  － 删除垃圾节点 symptoms/' + j.file + '（' + j.title + '）')
}
console.log('\n完成')
