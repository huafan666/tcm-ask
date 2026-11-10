'use strict'
// tools/bench-synthetic.js —— 用「教科书病人」测问诊的策略与路径质量
//
// 为什么需要这个测法：
//   真实医案（经方实验录）是古文，措辞和我们白话触发词差很远。
//   实测 30 问里 27.7 问答「不知道」，根本无法判定 —— 那是**词表覆盖问题**，不是问诊策略问题。
//
// 所以另做一套干净的实验：
//   拿每个方剂自己 needs 里的某一条路径当「教科书病人」——
//     · 该路径里 x.yes 的条件 → 病人真的有（答是）
//     · 该路径里 x.no  的条件 → 病人明确没有（答否）
//     · 其他所有症状 → 按 --others 决定：no（默认，病人没有别的毛病）或 unknown（不知道）
//   然后问诊，看能不能收敛到这个方、用了多少问。
//
// 用法：
//   node tools/bench-synthetic.js               前 30 个方剂
//   node tools/bench-synthetic.js --limit 50
//   node tools/bench-synthetic.js --others unknown
const path = require('path')
const fs = require('fs')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))

const args = process.argv.slice(2)
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const LIMIT = parseInt(getArg('--limit', '30'), 10) || 30
const OTHERS = getArg('--others', 'no')        // no | unknown
const MAXQ = parseInt(getArg('--maxq', '30'), 10)
const SEC_PER_Q = 2

const { registry } = loadAll(path.join(ROOT, 'plugins'))
const eng0 = new Engine(registry)

/**
 * 把一条 needs 路径**递归展开到叶子症状**。
 * 为什么必须展开：路径里经常引用「证候」这类派生节点（例如百合滑石散需要 `baihe_bing.yes`），
 * 如果只把叶子设成 yes，派生节点靠自己的 needs 算不出来，目标方就会被自己否死。
 *
 * 返回 { has:Set(叶子), not:Set(叶子) } 或 null（该路径无法干净展开）
 */
function expandPath(path, depth = 0, seen = new Set()) {
  const has = new Set(), not = new Set()
  if (depth > 4) return null
  for (const c of path) {
    const [n, v] = eng0.splitRef(c)
    const d = registry[n]
    if (!d) return null
    const isLeaf = typeof d.trigger === 'function' && (!d.needs || !d.needs.length)
    if (v === 'yes') {
      if (isLeaf) { has.add(n); continue }
      // 派生节点 → 找一条能干净展开的路径继续往下
      if (!d.needs || !d.needs.length) return null
      if (seen.has(n)) return null
      const sub = eng0.normalizeNeeds(d.needs)
      let done = false
      for (const sp of sub) {
        const r = expandPath(sp, depth + 1, new Set(seen).add(n))
        if (r) { r.has.forEach(x => has.add(x)); r.not.forEach(x => not.add(x)); done = true; break }
      }
      if (!done) return null
    } else {
      // 阴性：只有叶子能直接设成 no；派生节点的「否」没法显式构造，放弃这条路径
      if (!isLeaf) return null
      not.add(n)
    }
  }
  // 同一叶子不能既 yes 又 no
  for (const x of has) if (not.has(x)) return null
  return { has, not }
}

// 挑有 needs、且不依赖脉象的方剂
function usesPulse(name) {
  const paths = eng0.normalizeNeeds(registry[name].needs)
  for (const p of paths) for (const c of p) {
    const dep = eng0.splitRef(c)[0]
    if (registry[dep] && registry[dep].kind === 'pulse') return true
  }
  return false
}

const formulas = Object.keys(registry).filter(n =>
  registry[n].kind === 'formula' &&
  registry[n].needs && registry[n].needs.length &&
  !usesPulse(n)
)

const rows = []
let tested = 0

for (const target of formulas) {
  if (tested >= LIMIT) break
  const paths = eng0.normalizeNeeds(registry[target].needs)

  // 依次找该方第一条能干净展开成叶子集的路径
  let picked = null
  for (let pi = 0; pi < paths.length; pi++) {
    const r = expandPath(paths[pi])
    if (r && r.has.size >= 2) { picked = { pi, path: paths[pi], ...r }; break }
  }
  if (!picked) continue
  tested++

  const HAS = picked.has, NOT = picked.not
  // 用引擎的关系约束把这个「人工病人」补全，免得造出自相矛盾的病例。
  // 例：白虎加人参汤那条路径只写了「大烦渴 + 不恶寒 + 口干舌燥」，
  // 于是这个病人对「口渴」的问题会答「没有」——可「大烦渴」本身就蕴含「口渴」。
  // 关系约束（data/symptom-relations.js）里 大烦渴 是 口渴 的下位，
  // 所以补全之后「口渴」= 是，病例才自洽。
  // 不补全的话，测出来的「丢失」是测法自己造出来的，不是知识库的毛病。
  const TRUTH = new Engine(registry)
  for (const x of HAS) TRUTH.setDirect(x, 'yes')
  for (const x of NOT) TRUTH.setDirect(x, 'no')
  const truthOf = name => {
    const s = TRUTH.state[name]
    if (s === 'yes' || s === 'no') return s
    return OTHERS
  }

  const e = new Engine(registry)
  const asker = new Asker(e)

  // 开场：病人只说一句主诉（用路径里第一个 yes 症状的反问话术）
  const firstYes = picked.path.find(c => eng0.splitRef(c)[1] === 'yes')
  const firstNode = eng0.splitRef(firstYes)[0]
  const opening = registry[firstNode].ask || registry[firstNode].title
  e.feed(opening.replace(/^是不是/, '').replace(/[？?]$/, ''))
  // 注意：开场用的是反问话术转述，可能点不亮 —— 没关系，接下来靠问诊补

  let qs = 0, groupQs = 0, unknownQs = 0, unique = false, exhausted = false
  const asked = []


  for (let i = 0; i < MAXQ; i++) {
    const cands = asker.candidates()
    if (cands.length <= 1) { unique = true; break }
    const q = asker.nextQuestion()
    if (!q) { exhausted = true; break }

    let ans
    if (q.isGroup) {
      const kids = registry[q.leaf] && registry[q.leaf].children ? registry[q.leaf].children : []
      const st = kids.map(truthOf)
      ans = st.includes('yes') ? 'yes' : (st.includes('unknown') ? 'unknown' : 'no')
      groupQs++
    } else {
      ans = truthOf(q.leaf)
    }

    if (ans === 'unknown') { asker.markAsked(q.leaf); unknownQs++ }
    else {
      e.setDirect(q.leaf, ans)
      if (q.isGroup) { asker.groupAskedCount += 1; if (ans === 'yes') asker.focusGroup(q.leaf) }
      if (ans === 'no') asker.markAsked(q.leaf)
    }
    asked.push((q.isGroup ? '[粗筛]' : '') + q.title + '=' + ans)
    qs++
  }

  const finalCands = asker.candidates()
  rows.push({
    target, title: registry[target].title,
    pathIndex: picked.pi, path: picked.path,
    qs, groupQs, unknownQs, sec: qs * SEC_PER_Q,
    finalCount: finalCands.length,
    inCand: finalCands.includes(target),
    top1: finalCands.length === 1 && finalCands[0] === target,
    unique, exhausted, asked,
    finalCands: finalCands.slice(0, 8)
  })
}

console.log('=== 教科书病人基准（每题 ' + SEC_PER_Q + ' 秒，其他症状答 ' + OTHERS + '）===')
console.log('测了 ' + rows.length + ' 个方剂\n')

const avgQ = rows.reduce((s, r) => s + r.qs, 0) / rows.length
const inCand = rows.filter(r => r.inCand).length
const top1 = rows.filter(r => r.top1).length
const uniq = rows.filter(r => r.unique).length
const exh = rows.filter(r => r.exhausted).length
const avgGroup = rows.reduce((s, r) => s + r.groupQs, 0) / rows.length
const avgUnknown = rows.reduce((s, r) => s + r.unknownQs, 0) / rows.length
const avgFinal = rows.reduce((s, r) => s + r.finalCount, 0) / rows.length

console.log('平均问题数        : ' + avgQ.toFixed(1) + ' 问（粗筛 ' + avgGroup.toFixed(1) +
  '，答不知道 ' + avgUnknown.toFixed(1) + '）')
console.log('平均耗时          : ' + (avgQ * SEC_PER_Q).toFixed(1) + ' 秒（约 ' + (avgQ * SEC_PER_Q / 60).toFixed(1) + ' 分钟）')
console.log('目标方仍在候选里  : ' + inCand + '/' + rows.length + ' = ' + (inCand / rows.length * 100).toFixed(1) + '%')
console.log('收敛为唯一且正确  : ' + top1 + '/' + rows.length + ' = ' + (top1 / rows.length * 100).toFixed(1) + '%')
console.log('收敛到唯一候选    : ' + uniq + '/' + rows.length + ' = ' + (uniq / rows.length * 100).toFixed(1) + '%')
console.log('问题问完仍未唯一  : ' + exh + '/' + rows.length + '（知识库本身分不开）')
console.log('平均剩余候选方    : ' + avgFinal.toFixed(1) + ' 个')

console.log('\n--- 逐方 ---')
console.log('方剂'.padEnd(22) + '问数'.padEnd(6) + '耗时'.padEnd(7) + '剩余'.padEnd(6) + '结果')
for (const r of rows) {
  const hit = r.top1 ? '✓唯一命中' : (r.inCand ? '○在候选' : '✗丢失')
  const t = String(r.title)
  console.log(
    (t.length > 18 ? t.slice(0, 18) + '…' : t).padEnd(22) +
    String(r.qs).padEnd(6) + (r.sec + 's').padEnd(7) +
    String(r.finalCount).padEnd(6) + hit +
    (r.top1 ? '' : '  剩：' + r.finalCands.map(x => registry[x] ? registry[x].title : x).slice(0, 4).join('、'))
  )
}

fs.writeFileSync(path.join(ROOT, 'data', 'bench-synthetic-result.json'), JSON.stringify(rows, null, 1) + '\n', 'utf8')
console.log('\n明细已写入 data/bench-synthetic-result.json')
