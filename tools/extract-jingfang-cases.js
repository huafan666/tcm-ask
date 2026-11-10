'use strict'
// tools/extract-jingfang-cases.js
// 从《经方实验录》（曹颖甫）维基文库纯文本里切出医案。
//
// 每个医案：
//   title     「桂枝汤证其一」
//   formula   从标题推出来的方名（桂枝汤）
//   complaint 医案正文里「诊治记录」部分（不含方药清单、不含按语议论）
//   herbs     方药清单原文（仅用于核对）
//
// 产物：data/texts/经方实验录-医案.json
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'data', 'texts', '经方实验录.txt')
const OUT = path.join(ROOT, 'data', 'texts', '经方实验录-医案.json')

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/).map(s => s.trim())

// 目录区在正文之前：找第二次出现「桂枝汤证其一」的位置作为正文起点
let start = -1, seen = 0
for (let i = 0; i < lines.length; i++) {
  if (/^桂枝汤证其一/.test(lines[i])) { seen++; if (seen === 2) { start = i; break } }
}
if (start < 0) { console.log('❌ 找不到正文起点'); process.exit(1) }

// 正文结束：附录/后记之类
let end = lines.length
for (let i = start; i < lines.length; i++) {
  if (/^(附录|跋|后记|编后)/.test(lines[i])) { end = i; break }
}

// 标题行：短、含「证」、不以句末标点结尾、不是「编辑」这类噪声
function isTitle(s) {
  if (!s || s.length > 26) return false
  if (/[。，、；：？！]$/.test(s)) return false
  if (/^(编辑|\[|\]|)$/.test(s)) return false
  return /证(其[一二三四五六七八九十]+)?(（附列门人治验）)?$/.test(s) && /汤|丸|散|证/.test(s)
}

// 方药清单行：药名（剂量）
const HERB = /^[\u4e00-\u9fa5]{2,8}（[一二三四五六七八九十百千钱两分枚片升合铢0-9．.]+/

const cases = []
let cur = null
for (let i = start; i < end; i++) {
  const s = lines[i]
  if (isTitle(s)) {
    if (cur) cases.push(cur)
    cur = { title: s, lines: [] }
    continue
  }
  if (!cur) continue
  if (s === '[' || s === ']' || s === '编辑' || s === '') continue
  cur.lines.push(s)
}
if (cur) cases.push(cur)

// 后处理：拆出 complaint / herbs
const out = []
for (const c of cases) {
  const body = c.lines
  // 方药清单起点
  let herbAt = -1
  for (let i = 0; i < body.length; i++) {
    if (HERB.test(body[i])) { herbAt = i; break }
  }
  const complaintLines = herbAt >= 0 ? body.slice(0, herbAt) : body.slice(0, 3)
  const herbLines = herbAt >= 0 ? body.slice(herbAt, Math.min(herbAt + 9, body.length)) : []
  // 去掉含「按」的议论段（有些案把按语写在方药之前）
  const clean = complaintLines.filter(l => !/^【?(按|又按)】?/.test(l) && !/^曹颖甫曰/.test(l))

  // 方名：标题去掉「证」「其X」「（附列…）」
  let formula = c.title
    .replace(/（附列门人治验）/g, '')
    .replace(/其[一二三四五六七八九十]+/g, '')
    .replace(/证$/, '')
    .trim()

  const complaint = clean.join('')
  if (complaint.length < 8) continue      // 太短的多半是空壳标题
  out.push({
    title: c.title,
    formula,
    complaint,
    herbs: herbLines.join(' ')
  })
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8')
console.log('切出医案 ' + out.length + ' 个 → ' + OUT)

// 统计方名分布
const byF = {}
for (const x of out) byF[x.formula] = (byF[x.formula] || 0) + 1
console.log('\n方名分布（前 25）：')
Object.entries(byF).sort((a, b) => b[1] - a[1]).slice(0, 25)
  .forEach(([k, v]) => console.log('  ' + k.padEnd(18) + v))

console.log('\n=== 前 5 个医案预览 ===')
for (const x of out.slice(0, 5)) {
  console.log('\n【' + x.title + '】→ 方名「' + x.formula + '」')
  console.log('  正文：' + x.complaint.slice(0, 150))
  console.log('  方药：' + x.herbs.slice(0, 60))
}
