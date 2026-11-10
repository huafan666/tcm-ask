'use strict'
// tools/mark-progress.js —— 给 data/texts/金匮要略-条文.json 标记整理进度
//   status: 'pending'（未处理） / 'done'（已建节点） / 'skip'（治则·脉象·禁忌条，按口径不落节点）
const fs = require('fs')
const path = require('path')
const FILE = path.join(__dirname, '..', 'data', 'texts', '金匮要略-条文.json')

const DONE = {
  2: ['2.1', '2.2', '2.3', '2.7', '2.11', '2.12', '2.13', '2.14', '2.15', '2.16', '2.17', '2.18',
    '2.19', '2.20', '2.21', '2.22', '2.23', '2.24', '2.25', '2.26', '2.27'],
  3: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.10', '3.11', '3.12', '3.13', '3.14', '3.15'],
  4: ['4.2', '4.3', '4.4', '4.5']
}
const SKIP = {
  2: ['2.4', '2.5', '2.6', '2.8', '2.9', '2.10'],
  3: ['3.9'],
  4: ['4.1']
}

const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
let nDone = 0, nSkip = 0
for (const ch of d.chapters) {
  const done = DONE[ch.chapterNo] || []
  const skip = SKIP[ch.chapterNo] || []
  for (const u of ch.units) {
    const short = u.id.replace('金匮', '')
    if (done.includes(short)) { u.status = 'done'; nDone++ }
    else if (skip.includes(short)) { u.status = 'skip'; nSkip++ }
    else u.status = 'pending'
  }
}
fs.writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n', 'utf8')

console.log('=== 各篇进度 ===')
let tAll = 0, tDone = 0, tSkip = 0, tPend = 0
for (const ch of d.chapters) {
  const c = { done: 0, skip: 0, pending: 0 }
  for (const u of ch.units) c[u.status] = (c[u.status] || 0) + 1
  tAll += ch.units.length; tDone += c.done; tSkip += c.skip; tPend += c.pending
  const flag = c.pending === 0 ? '  ✓ 已完成' : ''
  console.log('第' + String(ch.chapterNo).padStart(2) + '篇 ' + ch.title.padEnd(26) +
    ' 共' + String(ch.units.length).padStart(3) + ' | 已建节点 ' + String(c.done).padStart(3) +
    ' | 不落节点 ' + String(c.skip).padStart(2) + ' | 待处理 ' + String(c.pending).padStart(3) + flag)
}
console.log('\n合计 ' + tAll + ' 条：已建节点 ' + tDone + '，不落节点 ' + tSkip + '，待处理 ' + tPend)
console.log('进度 ' + ((tDone + tSkip) / tAll * 100).toFixed(1) + '%')
