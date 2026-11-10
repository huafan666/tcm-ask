'use strict'
// tools/check-negation-coverage.js —— 「条文说了否定条件，方剂 needs 里有没有」
//
// 这是逐条过条文时最核心的一类检查。
// 做法：给一小张**人工确认过的**否定词→症状节点表，只在原文里出现这些固定搭配时才比对，
// 不做模糊推测（试过自动匹配，会把「不呕」对到「吐血」，那种报告比没有更糟）。
//
// 用法：
//   node tools/check-negation-coverage.js            两本书都查
//   node tools/check-negation-coverage.js --book jinkui
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const args = process.argv.slice(2)
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const BOOK = getArg('--book', '')

// 人工确认过的「原文说法 → 症状节点」。只收意义明确、不含歧义的。
const NEG_MAP = [
  { re: /不呕/, node: 'vomiting', label: '不呕' },
  { re: /不渴/, node: 'thirsty', label: '不渴' },
  { re: /不用水|不欲饮/, node: 'thirsty', label: '不用水/不欲饮' },
  { re: /不恶寒/, node: 'cold_aversion', label: '不恶寒' },
  { re: /不下利|不利者.*下|不泄/, node: 'diarrhea', label: '不下利' },
  { re: /不汗出|无汗|不得汗/, node: 'sweat', label: '不汗出/无汗' },
  { re: /身不疼|不痛/, node: 'body_pain', label: '身不疼/不痛' },
  { re: /不能食|不欲食|不欲饮食/, node: 'low_appetite', label: '不能食' },
  { re: /小便不利/, node: 'urination_difficulty', label: '小便不利（正证）', positive: true },
  { re: /不烦/, node: 'restless', label: '不烦' },
  { re: /手足不逆冷|手足温/, node: 'cold_extremities', label: '手足温' }
]

let SIMP = {}
try { SIMP = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'texts', '繁简对照.json'), 'utf8')).map || {} } catch (_) {}
const simp = s => [...s].map(c => SIMP[c] || c).join('')
const norm = s => s.replace(/[（）()\s　、，。；：]/g, '')

const titleIndex = new Map()
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'formula') continue
  const base = d.title.replace(/[(（][^)）]*[)）]/g, '')
  const aliases = [base]
  const m = d.title.match(/[(（]([^)）]+)[)）]/)
  if (m) aliases.push(m[1])
  for (const a of aliases) { const k = norm(a); if (k && !titleIndex.has(k)) titleIndex.set(k, id) }
}
const SHORT_ALIAS = { 肾气丸: '八味肾气丸', 赤石脂丸: '乌头赤石脂丸', 胶艾汤: '芎归胶艾汤' }
function within1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, diff = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++diff > 1) return false
    if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++ }
  }
  return true
}
function findFormula(name) {
  const raw = norm(simp(name))
  if (!raw || raw.length < 2) return null
  // 原文常把几个方的名字连在一句里（「攻表宜桂枝汤」「当以温经汤」「浮者宜杏子汤」），
  // 抽取时前头的动词/主语会粘上来。这里逐字往前剥，剥到能匹配上已知方名为止。
  for (let cut = 0; cut <= 5 && cut < raw.length - 1; cut++) {
    const k = raw.slice(cut)
    if (titleIndex.has(k)) return titleIndex.get(k)
    if (SHORT_ALIAS[k] && titleIndex.has(norm(SHORT_ALIAS[k]))) return titleIndex.get(norm(SHORT_ALIAS[k]))
  }
  let best = null
  for (const [t, id] of titleIndex) {
    if (within1(t, raw)) return id
    if (t.startsWith(raw) || raw.startsWith(t) || t.endsWith(raw) || raw.endsWith(t)) {
      const d = Math.abs(t.length - raw.length)
      if (d <= 4 && Math.min(t.length, raw.length) >= 5 && (!best || d < best.d)) best = { id, d }
    }
  }
  return best ? best.id : null
}

const FORMULA_TAIL = '湯汤散丸圓圆煎酒膏'
const NAME_PREFIX = '用與与服宜可先後后更凡若属屬恒常以然此即復复再仍不飲饮'
function formulaNames(text) {
  const out = new Set()
  const re = new RegExp('([\\u4e00-\\u9fff]{2,12}[' + FORMULA_TAIL + '])(?=主之|方|，宜|，與|。|；|$|證)', 'g')
  let m
  while ((m = re.exec(text))) {
    let name = m[1]
    let changed = true
    while (changed && name.length > 2) {
      changed = false
      if (NAME_PREFIX.includes(name[0])) { name = name.slice(1); changed = true }
    }
    if (name.length >= 2 && new RegExp('[' + FORMULA_TAIL + ']$').test(name)) out.add(name)
  }
  return [...out]
}

const books = BOOK ? [BOOK] : ['shanghan', 'jinkui']
const rows = []
for (const b of books) {
  const file = b === 'jinkui' ? '金匮要略-条文.json' : '伤寒论-条文.json'
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'texts', file), 'utf8'))
  for (const ch of db.chapters) {
    for (const u of ch.units) {
      if (u.status === 'skip') continue
      const st = simp(u.text)
      const fnames = (u.formulasHint || formulaNames(u.text)).map(n => ({ n, id: findFormula(norm(simp(n))) })).filter(f => f.id)
      if (!fnames.length) continue
      const hits = []
      for (const nm of NEG_MAP) {
        if (!nm.re.test(st)) continue
        // 条文里出现「不X」，看这些方的 needs 里有没有对应的 .no（positive 的看 .yes）
        const want = nm.positive ? '.yes' : '.no'
        const okIds = fnames.filter(f => new RegExp('\\b' + nm.node + '\\' + want).test(JSON.stringify(registry[f.id].needs || [])))
        if (!okIds.length) hits.push({ label: nm.label, node: nm.node, want })
      }
      if (hits.length) rows.push({ book: b, id: u.id, text: st, formulas: fnames.map(f => registry[f.id].title), hits })
    }
  }
}

console.log('=== 否定条件覆盖检查（' + (BOOK || '伤寒论 + 金匮要略') + '）===')
console.log('判据：条文里出现某个人工确认的否定说法，但该条点到的方 needs 里没有对应的 .no')
console.log('')
let n = 0
for (const r of rows) {
  n++
  console.log('【' + r.id + '】' + r.text.slice(0, 62))
  console.log('   方：' + r.formulas.join('、'))
  console.log('   缺：' + r.hits.map(h => h.label + ' → needs 缺 ' + h.node + h.want).join(' ； '))
}
console.log('\n' + '─'.repeat(70))
console.log('条文里出现人工确认的否定说法、但相应方 needs 没落的数量：' + rows.length)
