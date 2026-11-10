'use strict'
// tools/audit-shanghanlun.js —— 逐条审核工作台
//
// 把「条文」和「知识库现状」摆在一起，好一条一条过：
//   条文原文 / 点到的方 / 方现在 needs 里写了什么 / 条文里的否定条件有没有落进 needs / 条文能命中哪些症状节点
//
// 用法：
//   node tools/audit-shanghanlun.js                全部 398 条（很长）
//   node tools/audit-shanghanlun.js --ch 5         只看第五篇（辨太阳病上）
//   node tools/audit-shanghanlun.js --seq 31-60    只看 31~60 条
//   node tools/audit-shanghanlun.js --gaps         只列「有缺口」的条
//   node tools/audit-shanghanlun.js --missing      只列「库里有找不到的方名」汇总
//
// 「缺口」的三个判据：
//   1. 条文点了某个方，但库里没有这个方
//   2. 条文点了某个方，但该方 needs 是空的
//   3. 条文写了「不呕 / 无大热 / 不汗出」这类否定条件，而该方 needs 里没有对应的 .no
//      —— 这是历史上最容易丢、也最锋利的一类鉴别信息
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'texts', '伤寒论-条文.json'), 'utf8'))

const args = process.argv.slice(2)
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const CH = parseInt(getArg('--ch', '0'), 10) || 0
const GAPS_ONLY = args.includes('--gaps')
const MISSING_ONLY = args.includes('--missing')
const SEQ = getArg('--seq', '')
let seqFrom = 0, seqTo = 9999
if (SEQ) {
  const [a, b] = SEQ.split('-')
  seqFrom = parseInt(a, 10) || 0
  seqTo = b ? (parseInt(b, 10) || 9999) : seqFrom
}

// ---------- 繁简 ----------
let SIMP = {}
try { SIMP = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'texts', '繁简对照.json'), 'utf8')).map || {} } catch (_) {}
const simp = s => [...s].map(c => SIMP[c] || c).join('')
const norm = s => s.replace(/[（）()\s　、，。；：]/g, '')

// ---------- 方名 → 插件 ----------
const titleIndex = new Map()
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'formula') continue
  // title 可能带别名，如「麻黄杏仁甘草石膏汤(麻杏石甘汤)」——
  // 括号里的是别名，括号外的才是正名，两边都要进索引
  const base = d.title.replace(/[(（][^)）]*[)）]/g, '')
  const aliases = [base]
  const m = d.title.match(/[(（]([^)）]+)[)）]/)
  if (m) aliases.push(m[1])
  for (const a of aliases) {
    const k = norm(a)
    if (k && !titleIndex.has(k)) titleIndex.set(k, id)
  }
}
/** 编辑距离 ≤1（用来吃掉原文里的错字，如「桂校附子汤」「自虎汤」） */
function within1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, diff = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++diff > 1) return false
    if (a.length > b.length) i++
    else if (a.length < b.length) j++
    else { i++; j++ }
  }
  return true
}
/** 只在「同名 / 只差一个错字 / 前后缀包含得足够多」时才认 */
function findFormula(name) {
  const k = norm(simp(name))
  if (!k || k.length < 2) return null
  if (titleIndex.has(k)) return titleIndex.get(k)
  // 前后缀包含：原文常把「桂枝去芍药加蜀漆牡蛎龙骨救逆汤」写成「去芍药加…救逆汤」
  let best = null
  for (const [t, id] of titleIndex) {
    if (t === k) return id
    if (within1(t, k)) return id
    if (t.startsWith(k) || k.startsWith(t) || t.endsWith(k) || k.endsWith(t)) {
      const d = Math.abs(t.length - k.length)
      const minLen = Math.min(t.length, k.length)
      if (d <= 4 && minLen >= 3 && (!best || d < best.d)) best = { id, d }
    }
  }
  return best ? best.id : null
}

// ---------- 症状节点关键词 ----------
const kwCache = new Map()
function kwsOf(id) {
  if (kwCache.has(id)) return kwCache.get(id)
  const d = registry[id]
  let out = []
  if (d && typeof d.trigger === 'function') {
    const m = /\[([\s\S]*?)\]/.exec(d.trigger.toString())
    if (m) for (const q of m[1].matchAll(/'([^']*)'|"([^"]*)"/g)) out.push(q[1] || q[2])
  }
  kwCache.set(id, out)
  return out
}
const LEAVES = Object.keys(registry).filter(id =>
  registry[id].kind === 'symptom' && typeof registry[id].trigger === 'function' && kwsOf(id).length)

function matchedSymptoms(text) {
  const hits = []
  for (const id of LEAVES) {
    for (const kw of kwsOf(id)) {
      if (kw.length >= 2 && text.includes(kw)) { hits.push(id); break }
    }
  }
  return hits
}

// ---------- 否定条件 ----------
// 只把条文里**原文的**否定短语列出来，不去猜它对应哪个节点——
// 自动映射很容易把「不呕」对到「吐血」这种地方（呕血的 trigger 也含「呕」），
// 那样的报告比没有还糟。这里只负责把「该看的地方」摆到眼前，判断留给人。
const NEG_RE = /(?:反|若|復|又)?(?:不|無|无|未|沒|没)[\u4e00-\u9fff]{1,4}/g
function negations(text) {
  const out = new Set()
  let m
  NEG_RE.lastIndex = 0
  while ((m = NEG_RE.exec(text))) out.add(m[0])
  return [...out]
}

// ---------- 主循环 ----------
const lines = []
const stat = { total: 0, withFormula: 0, missFormula: 0, noNeeds: 0, negTotal: 0, negMissing: 0 }
const missingFormulas = new Map()   // 方名 -> {条, 条文}

for (const ch of DB.chapters) {
  if (CH && ch.chapterNo !== CH) continue
  if (!ch.units.length) continue
  if (!MISSING_ONLY) {
    lines.push('')
    lines.push('═'.repeat(74))
    lines.push('第 ' + ch.chapterNo + ' 篇  ' + ch.title + '（' + ch.units.length + ' 条）')
    lines.push('═'.repeat(74))
  }
  for (const u of ch.units) {
    if (u.seq < seqFrom || u.seq > seqTo) continue
    stat.total++
    const st = simp(u.text)
    const negs = negations(st)
    const hits = matchedSymptoms(st)
    const fnames = u.formulasHint || []
    const found = fnames.map(n => ({ name: n, id: findFormula(n) }))
    const realFound = found.filter(f => f.id)
    const missing = found.filter(f => !f.id)
    if (fnames.length) stat.withFormula++
    if (missing.length) {
      stat.missFormula++
      for (const f of missing) {
        if (!missingFormulas.has(f.name)) missingFormulas.set(f.name, { seq: u.seq, text: st })
      }
    }
    const noNeeds = realFound.filter(f => !(registry[f.id].needs || []).length)
    if (noNeeds.length) stat.noNeeds++
    if (negs.length) stat.negTotal += negs.length

    const bad = missing.length || noNeeds.length
    if ((GAPS_ONLY || MISSING_ONLY) && !bad) continue

    const out = []
    out.push('')
    out.push('【' + u.id + '】' + st)
    for (const f of found) {
      if (!f.id) { out.push('   方：' + f.name + '   ⚠ 库里没有这个方'); continue }
      const d = registry[f.id]
      const nd = d.needs || []
      out.push('   方：' + d.title + ' (' + f.id + ')')
      out.push('      needs=' + (nd.length ? JSON.stringify(nd) : '⚠ 空'))
    }
    if (negs.length) out.push('   条文否定词：' + negs.join('  '))
    if (hits.length) out.push('   症状命中：' + hits.map(id => registry[id].title).join('、'))
    if (!MISSING_ONLY) lines.push(...out)
  }
}

if (MISSING_ONLY) {
  console.log('=== 条文点到、但库里没有的方名（' + missingFormulas.size + ' 个）===')
  const rows = [...missingFormulas.entries()]
  for (const [name, info] of rows) {
    console.log('  ' + name.padEnd(14) + '  首见 伤寒' + info.seq + '：' + info.text.slice(0, 60))
  }
} else {
  console.log(lines.join('\n'))
}

console.log('\n' + '─'.repeat(74))
console.log('统计：条文 ' + stat.total + ' 条｜点到方 ' + stat.withFormula +
  ' 条｜方名缺失 ' + stat.missFormula + ' 条｜needs 为空 ' + stat.noNeeds +
  ' 条｜条文否定词 ' + stat.negTotal + ' 处（逐条人工判断有没有落进 needs）')
