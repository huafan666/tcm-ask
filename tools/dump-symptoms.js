'use strict'
// tools/dump-symptoms.js —— 列出全部症状（id + 标题），供归族设计用
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const rows = []
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'symptom') continue
  rows.push(id + ' | ' + (d.title || ''))
}
rows.sort()
const out = path.join(ROOT, 'data', 'symptoms-list.txt')
fs.writeFileSync(out, rows.join('\n') + '\n', 'utf8')
console.log('共 ' + rows.length + ' 个症状 → ' + out)
