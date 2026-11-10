'use strict'
// tools/stats-symptoms.js —— 症状统计 + 找「同一个大类的细分子类」
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const kinds = {}
for (const d of Object.values(registry)) kinds[d.kind] = (kinds[d.kind] || 0) + 1
console.log('节点类型统计:', JSON.stringify(kinds))

function kws(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}

// 按关键词归族：看哪些症状节点共享同一个核心动作词
const FAMILIES = {
  '呕/吐': /呕|吐/,
  '下利/泻': /下利|泄|溏|泻|利/,
  '汗': /汗/,
  '渴': /渴/,
  '小便': /小便|尿|溺/,
  '咳/喘': /咳|喘|息/,
  '痛': /痛|疼/,
  '热': /热|烧/,
  '神志': /烦|躁|谵|狂|昏|眠|寐/
}

const sympt = Object.entries(registry).filter(([, d]) => d.kind === 'symptom')
console.log('\n症状节点总数: ' + sympt.length)

for (const [name, re] of Object.entries(FAMILIES)) {
  const hit = sympt.filter(([id, d]) => re.test((d.title || '') + ' ' + kws(d).join(' ')))
  console.log('\n=== ' + name + ' 族（' + hit.length + ' 个）===')
  for (const [id, d] of hit) console.log('  ' + id.padEnd(28) + d.title)
}
