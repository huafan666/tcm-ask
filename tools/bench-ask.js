'use strict'
// tools/bench-ask.js —— 用真实医案给问诊流程打分
//
// 做法：
//   1. 读 data/texts/经方实验录-医案.json（曹颖甫《经方实验录》切出来的医案）
//   2. 把医案里的「诊治记录」喂给一个探针引擎，算出这个病人身上到底有哪些症状（TRUTH）
//   3. 用第一句/前若干字作为病人的开场主诉，进入问诊；之后每个问题都按 TRUTH 如实回答
//   4. 每个问题算 2 秒，统计：问了几问、耗时、最终候选方里有没有医案实际用的那个方
//
// 用法：
//   node tools/bench-ask.js                 全部医案
//   node tools/bench-ask.js --limit 30      只测前 30 个
//   node tools/bench-ask.js --limit 30 --opening 12   开场只给前 12 字（默认 20）
const path = require('path')
const fs = require('fs')
const ROOT = path.join(__dirname, '..')
const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { Engine } = require(path.join(ROOT, 'engine', 'engine'))
const { Asker } = require(path.join(ROOT, 'engine', 'asker'))

const args = process.argv.slice(2)
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const LIMIT = parseInt(getArg('--limit', '0'), 10) || 0
const OPENING = parseInt(getArg('--opening', '20'), 10)
const MAXQ = parseInt(getArg('--maxq', '30'), 10)
const SEC_PER_Q = 2

const { registry } = loadAll(path.join(ROOT, 'plugins'))

// 方名 → 节点 id（按 title 精确/近似匹配）
const norm = s => String(s || '').replace(/黄耆/g, '黄芪').replace(/\s+/g, '')
const titleMap = new Map()
for (const [id, d] of Object.entries(registry)) {
  if (d.kind !== 'formula') continue
  const t = norm(d.title)
  if (!titleMap.has(t)) titleMap.set(t, id)
}
function findFormula(name) {
  const n = norm(name)
  if (titleMap.has(n)) return titleMap.get(n)
  // 去掉括号里的别名再试，如「茯苓桂枝白术甘草汤(苓桂术甘汤)」
  for (const [t, id] of titleMap) {
    if (t.startsWith(n) || n.startsWith(t)) return id
  }
  return null
}

const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'texts', '经方实验录-医案.json'), 'utf8'))
const sel = LIMIT ? cases.slice(0, LIMIT) : cases

// 病人三种回答：yes=医案明说有；no=医案明说没有；unknown=医案压根没提 → 答「不知道」
const TRUTH_MODE = getArg('--truth', '3way')   // 3way（默认，诚实） | yesonly（旧口径，会把没提当没有）
const rows = []
let skipped = 0

for (const c of sel) {
  const target = findFormula(c.formula)
  if (!target) { rows.push({ ...c, status: 'no-node', target: null }); continue }

  // 探针：用医案正文算出三态真相（引擎已经会识别「不渴/无汗」这类否定说法）
  const probe = new Engine(registry)
  probe.feed(c.complaint)
  const truthOf = name => probe.state[name] || 'unknown'
  const TRUTH_YES = new Set(Object.keys(probe.state).filter(k => probe.state[k] === 'yes'))

  // 开场主诉：取诊治记录的前 OPENING 个字（到标点处截断，像真人开口）
  let opening = c.complaint.slice(0, OPENING)
  const cut = opening.search(/[。；！？]/)
  if (cut > 5) opening = opening.slice(0, cut)

  const e = new Engine(registry)
  const asker = new Asker(e)
  if (opening) e.feed(opening)

  let qs = 0
  let groupQs = 0
  let unknownQs = 0
  const asked = []
  let converged = false

  for (let i = 0; i < MAXQ; i++) {
    const cands = asker.candidates()
    if (cands.length <= 1) { converged = true; break }
    const q = asker.nextQuestion()
    if (!q) { converged = true; break }

    // 决定回答
    let ans
    if (q.isGroup) {
      const kids = registry[q.leaf] && registry[q.leaf].children ? registry[q.leaf].children : []
      const st = kids.map(truthOf)
      if (st.includes('yes')) ans = 'yes'
      else if (TRUTH_MODE === 'yesonly') ans = 'no'
      else ans = st.some(s => s === 'unknown') ? 'unknown' : 'no'
      groupQs++
    } else {
      const st = truthOf(q.leaf)
      ans = st === 'yes' ? 'yes' : (TRUTH_MODE === 'yesonly' ? 'no' : st)
    }

    if (ans === 'unknown') {
      asker.markAsked(q.leaf)
      unknownQs++
    } else {
      e.setDirect(q.leaf, ans)
      if (q.isGroup) {
        asker.groupAskedCount += 1
        if (ans === 'yes') asker.focusGroup(q.leaf)
      }
      if (ans === 'no') asker.markAsked(q.leaf)
    }
    asked.push((q.isGroup ? '[粗筛]' : '') + q.title + '=' + ans)
    qs++
  }

  const finalCands = asker.candidates()
  rows.push({
    ...c,
    status: 'ok',
    target,
    targetTitle: registry[target].title,
    truthCount: TRUTH_YES.size,
    opening,
    qs,
    groupQs,
    unknownQs,
    sec: qs * SEC_PER_Q,
    finalCount: finalCands.length,
    inCand: finalCands.includes(target),
    top1: finalCands.length === 1 && finalCands[0] === target,
    converged,
    asked
  })
}

// ---------- 报告 ----------
const ok = rows.filter(r => r.status === 'ok')
const noNode = rows.filter(r => r.status === 'no-node')

console.log('=== 医案问诊基准（每题 ' + SEC_PER_Q + ' 秒）===')
console.log('医案总数 ' + rows.length + '｜可测（方剂在库中）' + ok.length + '｜方剂不在库中 ' + noNode.length)
if (noNode.length) {
  console.log('  跳过：' + [...new Set(noNode.map(r => r.formula))].join('、'))
}

if (ok.length) {
  const avgQ = ok.reduce((s, r) => s + r.qs, 0) / ok.length
  const avgSec = avgQ * SEC_PER_Q
  const inCand = ok.filter(r => r.inCand).length
  const top1 = ok.filter(r => r.top1).length
  const conv = ok.filter(r => r.converged).length
  const avgGroup = ok.reduce((s, r) => s + r.groupQs, 0) / ok.length
  const avgFinal = ok.reduce((s, r) => s + r.finalCount, 0) / ok.length
  const maxSec = Math.max(...ok.map(r => r.sec))
  const minSec = Math.min(...ok.map(r => r.sec))

  console.log('\n--- 汇总 ---')
  const avgUnknown = ok.reduce((s, r) => s + (r.unknownQs || 0), 0) / ok.length
  console.log('平均问题数        : ' + avgQ.toFixed(1) + ' 问（其中答「不知道」' + avgUnknown.toFixed(1) + ' 问）')
  console.log('平均耗时          : ' + avgSec.toFixed(1) + ' 秒（约 ' + (avgSec / 60).toFixed(1) + ' 分钟）')
  console.log('问数范围          : ' + minSec + ' ~ ' + maxSec + ' 秒')
  console.log('其中粗筛问题      : 平均 ' + avgGroup.toFixed(1) + ' 问')
  console.log('目标方仍在候选里  : ' + inCand + '/' + ok.length + ' = ' + (inCand / ok.length * 100).toFixed(1) + '%')
  console.log('收敛为唯一且正确  : ' + top1 + '/' + ok.length + ' = ' + (top1 / ok.length * 100).toFixed(1) + '%')
  console.log('已收敛（候选≤1）  : ' + conv + '/' + ok.length)
  console.log('平均剩余候选方    : ' + avgFinal.toFixed(1) + ' 个')

  console.log('\n--- 逐案 ---')
  console.log('医案'.padEnd(26) + '目标方'.padEnd(16) + '问数'.padEnd(6) + '耗时'.padEnd(8) + '剩余候选'.padEnd(9) + '命中')
  for (const r of ok) {
    const hit = r.top1 ? '✓唯一' : (r.inCand ? '○在候选' : '✗丢失')
    console.log(
      (r.title.length > 22 ? r.title.slice(0, 22) + '…' : r.title).padEnd(26) +
      (String(r.targetTitle).length > 12 ? String(r.targetTitle).slice(0, 12) + '…' : String(r.targetTitle)).padEnd(16) +
      String(r.qs).padEnd(6) + (r.sec + 's').padEnd(8) +
      String(r.finalCount).padEnd(9) + hit
    )
  }

  // 失败案细节
  const lost = ok.filter(r => !r.inCand)
  if (lost.length) {
    console.log('\n--- 目标方丢失的医案（诊断一下）---')
    for (const r of lost) {
      console.log('\n【' + r.title + '】目标「' + r.targetTitle + '」')
      console.log('  真实症状 ' + r.truthCount + ' 个：' + r.asked.slice(0, 8).join(' / '))
      console.log('  剩余候选：' + r.finalCount + ' 个')
    }
  }
}

fs.writeFileSync(path.join(ROOT, 'data', 'bench-ask-result.json'), JSON.stringify(rows, null, 1) + '\n', 'utf8')
console.log('\n明细已写入 data/bench-ask-result.json')
