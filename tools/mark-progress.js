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
  4: ['4.2', '4.3', '4.4', '4.5'],
  5: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.10', '5.11', '5.13', '5.14', '5.15'],
  6: ['6.1', '6.2', '6.4', '6.5', '6.6', '6.8', '6.9', '6.12', '6.14', '6.15', '6.16', '6.17', '6.18', '6.19'],
  7: ['7.1', '7.3', '7.5', '7.6', '7.7', '7.8', '7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17'],
  8: ['8.1', '8.2', '8.3', '8.4'],
  9: ['9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10', '9.11', '9.12', '9.13'],
  10: ['10.2', '10.3', '10.8', '10.9', '10.10', '10.11', '10.12', '10.13', '10.14',
    '10.15', '10.16', '10.17', '10.18', '10.19', '10.20']
}
const SKIP = {
  2: ['2.4', '2.5', '2.6', '2.8', '2.9', '2.10'],
  3: ['3.9'],
  4: ['4.1'],
  5: ['5.8', '5.9', '5.12'],
  6: ['6.3', '6.7', '6.10', '6.11', '6.13'],
  7: ['7.2', '7.4', '7.9', '7.10'],
  9: ['9.1', '9.2'],
  10: ['10.1', '10.4', '10.5', '10.6', '10.7', '10.21']
}
// 整篇跳过：杂疗方与食物禁忌三篇（用户决定）。内容是食物禁忌清单和杂方，
// 没有「症状-证候-方剂」结构，整篇不落节点。详见 data/review/金匮要略-整篇跳过.md
const SKIP_CHAPTERS = [23, 24, 25]

const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
for (const ch of d.chapters) {
  const done = DONE[ch.chapterNo] || []
  const skip = SKIP[ch.chapterNo] || []
  const wholeSkip = SKIP_CHAPTERS.includes(ch.chapterNo)
  for (const u of ch.units) {
    const short = u.id.replace('金匮', '')
    if (wholeSkip) u.status = 'skip'
    else if (done.includes(short)) u.status = 'done'
    else if (skip.includes(short)) u.status = 'skip'
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
