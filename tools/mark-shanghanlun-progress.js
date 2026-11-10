'use strict'
// tools/mark-shanghanlun-progress.js —— 把逐条审核的进度写回条文 JSON
//
// 398 条分成三批核完：
//   批1：辨太阳病（上）30 条
//   批2：辨太阳病（中/下）+ 阳明 + 少阳 + 太阴 + 霍乱 + 阴阳易 267 条
//   批3：辨少阴 + 辨厥阴 101 条
//
// 用法：node tools/mark-shanghanlun-progress.js [--write]
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FILE = path.join(ROOT, 'data', 'texts', '伤寒论-条文.json')
const WRITE = process.argv.includes('--write')

const BATCH_OF_CHAPTER = {
  5: { batch: 1, ledger: 'data/review/伤寒论-批1.md' },
  6: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  7: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  8: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  9: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  10: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  13: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  14: { batch: 2, ledger: 'data/review/伤寒论-批2.md' },
  11: { batch: 3, ledger: 'data/review/伤寒论-批3.md' },
  12: { batch: 3, ledger: 'data/review/伤寒论-批3.md' }
}

const db = JSON.parse(fs.readFileSync(FILE, 'utf8'))
let done = 0, skipped = 0, unknown = 0
const perBatch = {}
for (const ch of db.chapters) {
  for (const u of ch.units) {
    if (ch.skip) { u.status = 'skip'; u.skipReason = ch.skipReason; skipped++; continue }
    const b = BATCH_OF_CHAPTER[ch.chapterNo]
    if (!b) { unknown++; continue }
    u.status = 'done'
    u.reviewedIn = b.ledger
    done++
    perBatch[b.batch] = (perBatch[b.batch] || 0) + 1
  }
}
db.progress = {
  note: '逐条审核进度：done = 已对照知识库核过一遍（是否改过见对应 data/review 台账）',
  done,
  skipped,
  notReviewed: unknown,
  byBatch: perBatch,
  updatedAt: new Date().toISOString().slice(0, 10)
}

console.log('=== 伤寒论逐条审核进度 ===')
console.log('已核 done：' + done + ' 条')
for (const k of Object.keys(perBatch).sort()) console.log('  批' + k + '：' + perBatch[k] + ' 条')
console.log('整篇 skip：' + skipped + ' 条（脉法/伤寒例/可不可诸篇）')
console.log('未纳入批次：' + unknown + ' 条')
if (unknown) process.exitCode = 1
if (!WRITE) { console.log('\n（预览，加 --write 写回）'); process.exit(0) }
fs.writeFileSync(FILE, JSON.stringify(db, null, 1) + '\n', 'utf8')
console.log('\n已写回 ' + FILE)
