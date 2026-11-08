'use strict'
// tools/annotate-shanghanlun.js
// 把现有 262 个条文节点统一标注来源为《伤寒论》，条号从插件里的手写注释
// （// 第35条: …）自动提取；没有条号的节点标 refs: []，但同样注明「伤寒论原方」。
//
//   node tools/annotate-shanghanlun.js            # 预览
//   node tools/annotate-shanghanlun.js --write    # 写 plugins/provenance.json

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const OUT = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const SOURCE_ID = 'shanghanlun'
const SOURCE = {
  label: '伤寒论原方',
  title: '伤寒论',
  fullTitle: '伤寒杂病论 · 伤寒部分',
  author: '张仲景',
  dynasty: '东汉',
  textFile: 'data/texts/伤寒论-gutenberg.txt',
  textSource: 'Project Gutenberg eBook #24272（清代通行本转录）',
  note: '条文出处以插件注释里的「第X条」为准；书序按宋本通行编号'
}

const DIRS = ['symptoms', 'pulses', 'syndromes', 'formulas']
const prev = (() => {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')) } catch (_) { return { version: 1, sources: {}, nodes: {}, edges: {} } }
})()

const out = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sources: Object.assign({}, prev.sources, { [SOURCE_ID]: SOURCE }),
  nodes: {},
  edges: {}
}

let withRefs = 0
let withoutRefs = 0
const rows = []

for (const dir of DIRS) {
  const full = path.join(PLUGINS, dir)
  if (!fs.existsSync(full)) continue
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith('.js')) continue
    const abs = path.join(full, f)
    const text = fs.readFileSync(abs, 'utf8')
    // 注意：node 名以文件里的 name 字段为准（有文件名拼错的，如 gangcao/gancao）
    const nameMatch = /name:\s*'([^']+)'/.exec(text)
    const name = nameMatch ? nameMatch[1] : f.replace(/\.js$/, '')

    // 条号：从注释行里抓「第X条」，按出现顺序去重
    const refs = []
    for (const m of text.matchAll(/第\s*(\d+)\s*条/g)) {
      const n = m[1]
      if (!refs.includes(n)) refs.push(n)
    }
    // 只保留前 4 个，避免一行上百条的极端情况
    const kept = refs.slice(0, 4)

    out.nodes[name] = {
      source: SOURCE_ID,
      label: SOURCE.label,
      refs: kept,
      by: 'system:shanghanlun'
    }
    if (kept.length) withRefs++
    else withoutRefs++
    rows.push({ name, dir, refs: kept })
  }
}

// 之前手工标注过的（若已存在 provenance.json 里的自定义条目）保留
for (const [name, rec] of Object.entries(prev.nodes || {})) {
  if (rec && rec.source && rec.source !== SOURCE_ID) out.nodes[name] = rec
}
for (const [key, rec] of Object.entries(prev.edges || {})) out.edges[key] = rec

console.log('节点总数:', rows.length)
console.log('带条号:', withRefs, '｜ 无条号（标为伤寒论原方但无具体条）:', withoutRefs)
console.log('\n抽样：')
for (const r of rows.filter(r => r.refs.length).slice(0, 6)) {
  console.log('  ' + r.name.padEnd(28) + ' 第' + r.refs.join('、') + '条')
}
for (const r of rows.filter(r => !r.refs.length).slice(0, 4)) {
  console.log('  ' + r.name.padEnd(28) + '（无条号）')
}

if (WRITE) {
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log('\n已写入 ' + OUT.replace(ROOT + path.sep, ''))
} else {
  console.log('\n（预览，未写盘。加 --write 生成 plugins/provenance.json）')
}
