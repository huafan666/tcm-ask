'use strict'
// tools/check-group-drift.js —— 检查「生成物」和「真源」是否漂移
//
// 背景：data/symptom-groups.js 是真源，plugins/symptoms/*_any.js 是生成物。
// 之前有几轮修改只改了生成物没改真源（sleep_any、vomit_any、bleeding_any…），
// 结果一重新生成就被覆盖回去。这个工具专门抓这类漂移。
const path = require('path')
const fs = require('fs')
const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)
const { GROUPS } = require(path.join(ROOT, 'data', 'symptom-groups.js'))
// 系统层（十问歌顺序）另有真源 data/symptom-systems.js，也要算作「受管理」
let SYSTEMS = []
try { SYSTEMS = require(path.join(ROOT, 'data', 'symptom-systems.js')).SYSTEMS } catch (_) { SYSTEMS = [] }

function kws(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const sameSet = (a, b) => a.length === b.length && a.slice().sort().join('|') === b.slice().sort().join('|')

let drift = 0
console.log('=== 分组生成物 vs 真源 漂移检查 ===')
for (const g of GROUPS) {
  const disk = registry[g.name]
  if (!disk) { console.log('  ✗ ' + g.name + ' 真源有但节点不存在（没生成？）'); drift++; continue }
  const probs = []
  if (!sameSet(kws(disk), g.trigger || [])) {
    probs.push('trigger 不同：真源 ' + JSON.stringify(g.trigger || []) + ' ｜ 实际 ' + JSON.stringify(kws(disk)))
  }
  if (!sameSet(disk.children || [], g.children || [])) {
    const onlySrc = (g.children || []).filter(x => !(disk.children || []).includes(x))
    const onlyDisk = (disk.children || []).filter(x => !(g.children || []).includes(x))
    probs.push('children 不同：真源多 ' + JSON.stringify(onlySrc) + ' ｜ 生成物多 ' + JSON.stringify(onlyDisk))
  }
  if ((disk.title || '') !== (g.title || '')) probs.push('title 不同：真源「' + g.title + '」实际「' + disk.title + '」')
  if (probs.length) {
    drift++
    console.log('\n  ✗ ' + g.name)
    for (const p of probs) console.log('      ' + p)
  }
}

// 反向：磁盘上有、真源里没有的分组（会被下次重生成漏掉吗？不会，但说明是手工加的）
const srcNames = new Set(GROUPS.map(g => g.name).concat(SYSTEMS.map(s => s.name)))
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'symptom_group') continue
  if (!srcNames.has(id)) {
    console.log('\n  ⚠ ' + id + ' 只在磁盘上，真源里没有（下次重生成不会被删，但也不受真源管理）')
    drift++
  }
}

console.log('\n漂移项 ' + drift + ' 个')
process.exit(drift === 0 ? 0 : 1)
