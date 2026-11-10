'use strict'
// tools/analyze-uncovered.js —— 系统粗筛的「漏网」诊断
//
// 思路（用户提的）：单症状方剂只要它的那个条件落在某个系统里，
// 病人对那个系统答「没有」时，这个条件就被置为 no，方剂自然被排除。
//
// 所以：把所有系统全部答「没有」之后**还留着的方剂**，
// 就是「条件不在任何系统里」的漏网之鱼 —— 它们永远无法被粗筛排除。
const path = require('path')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))

const e = new Engine(registry)
const asker = new Asker(e)
const systems = asker.systems()
console.log('系统数 ' + systems.length + '，全部答「没有」…\n')
for (const s of systems) e.setDirect(s.name, 'no')

const left = asker.candidates()
console.log('全系统答没有之后，仍可能成立的方剂：' + left.length + ' 个\n')

if (!left.length) { console.log('✓ 所有方剂都被粗筛排除了'); process.exit(0) }

// 对每个漏网方剂，找出它「为什么还没被排除」
console.log('=== 漏网方剂及其条件 ===')
const uncoveredSym = new Map()
for (const id of left) {
  const paths = e.normalizeNeeds(registry[id].needs)
  const live = []
  for (const p of paths) {
    const st = p.map(c => {
      const [n, v] = e.splitRef(c)
      const s = e.state[n] || 'unknown'
      return { n, v, s, ok: s === v, unknown: s === 'unknown' }
    })
    // 这条路径是否还可能（没有条件被否）
    if (!st.some(x => !x.ok && !x.unknown)) live.push(st)
  }
  const conds = []
  for (const p of live) for (const x of p) if (x.unknown && !conds.includes(x.n)) conds.push(x.n)
  console.log('  ' + registry[id].title.padEnd(22) + '[' + registry[id].kind + '] 未确定条件: ' + (conds.join('、') || '（无，说明被 yes 满足了）'))
  for (const c of conds) {
    if (!uncoveredSym.has(c)) uncoveredSym.set(c, [])
    uncoveredSym.get(c).push(registry[id].title)
  }
}

console.log('\n=== 这些「未确定条件」是不是不在任何系统里？ ===')
const sysChildren = new Set()
for (const s of systems) for (const c of (s.def.children || [])) sysChildren.add(c)
const outside = [...uncoveredSym.keys()].filter(c => !sysChildren.has(c))
const inside = [...uncoveredSym.keys()].filter(c => sysChildren.has(c))
console.log('在某个系统里的（本该被排除却没排除 → 逻辑问题）: ' + inside.length)
for (const c of inside) console.log('   ' + c + '（' + registry[c].title + '）→ 影响 ' + uncoveredSym.get(c).join('、'))
console.log('\n不在任何系统里的（真·漏网，需要补进系统）: ' + outside.length)
for (const c of outside) console.log('   ' + c + '（' + registry[c].title + '）→ 影响 ' + uncoveredSym.get(c).join('、'))
