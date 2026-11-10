'use strict'
// tools/find-duplicates.js —— 找标题相同/高度相似的重名节点
const path = require('path')
const { loadAll } = require(path.join(__dirname, '..', 'core/loader'))
const { registry } = loadAll(path.join(__dirname, '..', 'plugins'))

const byTitle = new Map()
for (const [id, def] of Object.entries(registry)) {
  const t = String(def.title || '').replace(/\s+/g, '')
  if (!t) continue
  if (!byTitle.has(t)) byTitle.set(t, [])
  byTitle.get(t).push(id)
}

let n = 0
console.log('=== 标题完全相同的节点 ===')
for (const [t, ids] of byTitle) {
  if (ids.length > 1) {
    console.log('  「' + t + '」 -> ' + ids.join(', '))
    n++
  }
}

// 拼音 id 只差 l/n、zh/z、ch/c、sh/s 的近重复
const norm = s => s.replace(/l(?=[a-z])/g, 'n').replace(/zh/g, 'z').replace(/ch/g, 'c').replace(/sh/g, 's')
const byNorm = new Map()
for (const id of Object.keys(registry)) {
  const k = norm(id) + '|' + registry[id].kind
  if (!byNorm.has(k)) byNorm.set(k, [])
  byNorm.get(k).push(id)
}
console.log('\n=== id 归一化后疑似重复 ===')
let m = 0
for (const k of byNorm.keys()) {
  const ids = byNorm.get(k)
  if (ids.length > 1) { console.log('  ' + ids.join('  ≈  ')); m++ }
}
console.log('\n共 ' + n + ' 组重名、' + m + ' 组近重复')
