'use strict'
// tools/jingui-extract.js
// 把 data/texts/金匮要略-wikisource.wikitext 切成「篇 / 条」，产出可逐条审核的 JSON。
//
//   node tools/jingui-extract.js            # 概览
//   node tools/jingui-extract.js --write    # 写 data/texts/金匮要略-条文.json
//   node tools/jingui-extract.js --chapter 2   # 只看第二篇的逐条列表
//
// 编号规则：篇号.篇内条序（只数条文行，方名/方后注不算条文）
// 原文保持繁体（与 wikisource 一致，便于逐字核对）；审核稿里再给简体对照。

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'data', 'texts', '金匮要略-wikisource.wikitext')
const OUT = path.join(__dirname, '..', 'data', 'texts', '金匮要略-条文.json')
const MAP_FILE = path.join(__dirname, '..', 'data', 'texts', '繁简对照.json')

// 繁→简：引擎 trigger 全是简体，原文是繁体，不过这一步会整条落空
const tradMap = (() => {
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).map || {} } catch (_) { return {} }
})()
function toSimp(s) {
  let out = ''
  for (const ch of s) out += (tradMap[ch] || ch)
  return out
}
const unmapped = new Map()

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const onlyChapter = (() => {
  const i = args.indexOf('--chapter')
  return i >= 0 ? Number(args[i + 1]) : null
})()

const raw = fs.readFileSync(SRC, 'utf8')

function clean(s) {
  return s
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^[:*#]+\s*/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// 方名 / 方后注的识别（wikitext 里方名常以 ; 开头）
const FORMULA_LINE = /^;/
const FORMULA_NOTE = /^(右|上)(\d+|[一二三四五六七八九十]+)味/

const chapters = []
let cur = null
for (const rawLine of raw.split(/\r?\n/)) {
  const h = /^==+\s*([^=\n]+?)\s*==+$/.exec(rawLine.trim())
  if (h) {
    cur = { title: h[1], units: [], formulas: [] }
    chapters.push(cur)
    continue
  }
  if (!cur) continue
  const line = rawLine.trim()
  if (!line) continue
  const isFormulaName = FORMULA_LINE.test(line)
  const text = clean(line)
  if (!text) continue
  if (isFormulaName || FORMULA_NOTE.test(text)) { cur.formulas.push(text); continue }
  cur.units.push(text)
}

// 正式篇（排除「附注 / 【附方】」这种小标题）
let chapterNo = 0
const out = { source: 'wikisource:金匱要略 (pageid 25028)', fetchedAt: fs.statSync(SRC).mtime.toISOString(), chapters: [] }
for (const c of chapters) {
  const isReal = /病脈證|病脈|方第|禁忌並治/.test(c.title)
  if (!isReal) {
    // 附方并入上一篇
    const prev = out.chapters[out.chapters.length - 1]
    if (prev) prev.attached = (prev.attached || []).concat(c.units)
    continue
  }
  chapterNo++
  out.chapters.push({
    chapterNo,
    title: c.title,
    units: c.units.map((text, i) => ({
      id: chapterNo + '.' + (i + 1),
      seq: i + 1,
      text,
      textSimp: toSimp(text),
      status: 'pending'
    })),
    formulas: c.formulas
  })
}

const totalUnits = out.chapters.reduce((n, c) => n + c.units.length, 0)
console.log('篇数:', out.chapters.length, '｜ 条文行数:', totalUnits)
console.log('繁简对照表:', Object.keys(tradMap).length, '个字')

if (onlyChapter) {
  const c = out.chapters.find(x => x.chapterNo === onlyChapter)
  if (!c) { console.log('没有第 ' + onlyChapter + ' 篇'); process.exit(1) }
  console.log('\n=== 第' + c.chapterNo + '篇 ' + c.title + '（' + c.units.length + ' 条）===')
  c.units.forEach(u => console.log('\n[' + u.id + '] ' + u.text))
  if (c.formulas.length) console.log('\n（本篇方名/方后注 ' + c.formulas.length + ' 行，未计入条文）')
} else {
  out.chapters.forEach(c => console.log('  ' + String(c.chapterNo).padStart(2) + '. ' + c.title + '  (' + c.units.length + ' 条)'))
}

if (WRITE) {
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log('\n已写入 ' + OUT.replace(path.join(__dirname, '..') + path.sep, ''))
}

// ---- 繁体字体检：把「简体语料里从没出现过」的字列出来，人工判断要不要补进对照表 ----
{
  const corpus = new Set()
  const addText = t => { for (const ch of t) if (/[\u4e00-\u9fff]/.test(ch)) corpus.add(ch) }
  const walk = dir => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue
      const p = path.join(dir, f.name)
      if (f.isDirectory()) { walk(p); continue }
      if (/\.(js|html|json|md)$/.test(f.name)) {
        try { addText(fs.readFileSync(p, 'utf8')) } catch (_) {}
      }
    }
  }
  walk(path.join(__dirname, '..', 'plugins'))
  walk(path.join(__dirname, '..', 'web'))

  const unknown = new Map()
  for (const c of out.chapters) for (const u of c.units) {
    for (const ch of u.text) {
      if (!/[\u4e00-\u9fff]/.test(ch)) continue
      if (tradMap[ch]) continue                 // 已映射
      if (corpus.has(ch)) continue              // 简体语料里出现过 → 视为本字
      unknown.set(ch, (unknown.get(ch) || 0) + 1)
    }
  }
  const top = [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  if (top.length) {
    console.log('\n可能是没映射的繁体字（简体语料里没出现过），按出现次数：')
    console.log('  ' + top.map(([c, n]) => c + '×' + n).join('  '))
    console.log('  → 确认是繁体就补进 data/texts/繁简对照.json；本来就是同一个字的忽略')
  } else {
    console.log('\n繁体字体检：没有可疑字 ✓')
  }
}
