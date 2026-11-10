'use strict'
// tools/debug-bench-loss.js —— 完全复刻 bench-synthetic 的流程，查目标方为何不在候选里
const path = require('path')
const fs = require('fs')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))

const MAXQ = parseInt(process.argv[2] || '30', 10)
const OTHERS = 'no'
const e0 = new Engine(registry)

function expandPath(p, depth = 0, seen = new Set()) {
  const has = new Set(), not = new Set()
  if (depth > 4) return null
  for (const c of p) {
    const [n, v] = e0.splitRef(c)
    const d = registry[n]
    if (!d) return null
    const isLeaf = typeof d.trigger === 'function' && (!d.needs || !d.needs.length)
    if (v === 'yes') {
      if (isLeaf) { has.add(n); continue }
      if (!d.needs || !d.needs.length || seen.has(n)) return null
      const sub = e0.normalizeNeeds(d.needs)
      let done = false
      for (const sp of sub) {
        const r = expandPath(sp, depth + 1, new Set(seen).add(n))
        if (r) { r.has.forEach(x => has.add(x)); r.not.forEach(x => not.add(x)); done = true; break }
      }
      if (!done) return null
    } else {
      if (!isLeaf) return null
      not.add(n)
    }
  }
  for (const x of has) if (not.has(x)) return null
  return { has, not }
}

function usesPulse(name) {
  for (const p of e0.normalizeNeeds(registry[name].needs)) for (const c of p) {
    const dep = e0.splitRef(c)[0]
    if (registry[dep] && registry[dep].kind === 'pulse') return true
  }
  return false
}

const formulas = Object.keys(registry).filter(n =>
  registry[n].kind === 'formula' && registry[n].needs && registry[n].needs.length && !usesPulse(n))

let lostCount = 0, tested = 0
for (const target of formulas) {
  if (tested >= 30) break
  const paths = e0.normalizeNeeds(registry[target].needs)
  let picked = null
  for (let pi = 0; pi < paths.length; pi++) {
    const r = expandPath(paths[pi])
    if (r && r.has.size >= 2) { picked = { pi, path: paths[pi], ...r }; break }
  }
  if (!picked) continue
  tested++

  const HAS = picked.has, NOT = picked.not
  const truthOf = n => HAS.has(n) ? 'yes' : (NOT.has(n) ? 'no' : OTHERS)

  const e = new Engine(registry)
  const asker = new Asker(e)
  const firstYes = picked.path.find(c => e0.splitRef(c)[1] === 'yes')
  const firstNode = e0.splitRef(firstYes)[0]
  const opening = (registry[firstNode].ask || registry[firstNode].title).replace(/^是不是/, '').replace(/[？?]$/, '')
  e.feed(opening)

  const log = []
  for (let i = 0; i < MAXQ; i++) {
    const cands = asker.candidates()
    if (cands.length <= 1) break
    const q = asker.nextQuestion()
    if (!q) break
    let ans
    if (q.isGroup) {
      const kids = registry[q.leaf] && registry[q.leaf].children ? registry[q.leaf].children : []
      ans = kids.some(k => HAS.has(k)) ? 'yes' : (OTHERS === 'unknown' ? 'unknown' : 'no')
    } else ans = truthOf(q.leaf)
    if (ans === 'unknown') asker.markAsked(q.leaf)
    else {
      e.setDirect(q.leaf, ans)
      if (q.isGroup) { asker.groupAskedCount += 1; if (ans === 'yes') asker.focusGroup(q.leaf) }
      if (q.isSystem && ans === 'yes') asker.markGateYes(q.leaf)
      if (ans === 'no') asker.markAsked(q.leaf)
    }
    log.push((q.isGroup ? '[粗筛' + (q.isSystem ? '·系统' : '') + ']' : '') + q.title + '=' + ans)
  }

  const final = asker.candidates()
  if (final.includes(target)) continue
  lostCount++
  console.log('=== 丢失 ' + registry[target].title + '（' + target + '）===')
  console.log('  应满足叶子: ' + [...HAS].join('、'))
  const bad = [...HAS].filter(n => e.state[n] !== 'yes')
  console.log('  实际状态: ' + (bad.length ? bad.map(n => n + '=' + e.state[n]).join(', ') : '全部 yes ✓'))
  console.log('  目标方 state: ' + e.state[target])
  console.log('  路径是否成立:')
  for (const [i, p] of e0.normalizeNeeds(registry[target].needs).entries()) {
    const st = p.map(c => {
      const [n, v] = e0.splitRef(c)
      const s = e.state[n] || 'unknown'
      return n + '.' + v + '=' + s + (s === v ? '✓' : '✗')
    })
    console.log('    P' + (i + 1) + ': ' + st.join(' '))
  }
  console.log('  问诊过程: ' + log.slice(0, 12).join(' | '))
  console.log('')
}
console.log('共丢失 ' + lostCount + ' / ' + tested)
