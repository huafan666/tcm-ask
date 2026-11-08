'use strict'
// tools/jingui-extract.js
// 把 data/texts/金匮要略-wikisource.wikitext 切成「篇 / 条」，产出可逐条审核的 JSON。
//
//   node tools/jingui-extract.js             # 概览
//   node tools/jingui-extract.js --chapter 2 # 第二篇逐条列表
//   node tools/jingui-extract.js --write     # 写 data/texts/金匮要略-条文.json
//
// 约定（2026-11 与用户确认）：
//   · 只输出简体（引擎 trigger 全是简体），繁体只在下载的原始 wkitext 里留档
//   · 编号用「能检索到的」：篇名 + 条文首句，条序只作为内部引用，不冒充教材条号
//   · 方名/方后注（「右五味…」「以水九升，煮取三升…」）不算条文

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'data', 'texts', '金匮要略-wikisource.wikitext')
const OUT = path.join(__dirname, '..', 'data', 'texts', '金匮要略-条文.json')
const MAP_FILE = path.join(__dirname, '..', 'data', 'texts', '繁简对照.json')

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const onlyChapter = (() => {
  const i = args.indexOf('--chapter')
  return i >= 0 ? Number(args[i + 1]) : null
})()

const tradMap = (() => {
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).map || {} } catch (_) { return {} }
})()
function toSimp(s) {
  let out = ''
  for (const ch of s) out += (tradMap[ch] || ch)
  return out
}

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

// ---- 方名 / 方后注 / 用法行 的识别 ----
// wikitext 里方剂块的写法形如：
//   :;栝蔞桂枝湯方
//   ::栝蔞根二兩　桂枝三兩…
//   ::上六味，以水九升，煮取三升，分溫三服…
const FORMULA_NOTE = [
  /^(右|上)\s*[一二三四五六七八九十百]+\s*味/,        // 右五味…
  /^[一二三四五六七八九十]+味/,                        // 六味…
  /(以水|以清酒|以东流水)[一二三四五六七八九十百]+\s*(升|斗|合)/,  // 以水九升
  /(煮取|煎取|取汁|去滓|温服|分温|顿服|日[二三]服|频频服)/,
  /(杵为散|捣为|炼蜜|和丸|末之|内诸药|更上|先煮|后内|为末|如梧子大)/,
  /^【?附方】?/,
  /^治(?:疗)?[^，。]{0,12}方$/
]

function classifyRaw(rawLine) {
  const t = rawLine.trim()
  if (/^::/.test(t)) return 'formula'          // 组成 / 用法
  if (/^:;/.test(t) || /^;/.test(t)) return 'formula'  // 方名
  return 'text'
}

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
  const text = clean(line)
  if (!text) continue
  const kind = classifyRaw(line)
  if (kind === 'formula' || text.startsWith(';') || FORMULA_NOTE.some(re => re.test(text))) {
    cur.formulas.push(text.replace(/^;/, ''))
    continue
  }
  cur.units.push(text)
}

// 篇名去「第X」尾缀，做成可检索的引用
function chapterRef(title) {
  return title.replace(/第[一二三四五六七八九十]+$/, '')
}

let chapterNo = 0
const out = {
  source: 'zh.wikisource《金匱要略》pageid 25028',
  fetchedNote: '原文繁体，已按 data/texts/繁简对照.json 转简体；方名与方后注不计入条文',
  numbering: '编号 = 篇号.篇内行序（内部引用）；对外引用用「篇名 + 条文首句」',
  chapters: []
}
for (const c of chapters) {
  const isReal = /病脈證|病脈|方第|禁忌並治/.test(c.title)
  if (!isReal) {
    const prev = out.chapters[out.chapters.length - 1]
    if (prev) prev.attached = (prev.attached || []).concat(c.units.map(toSimp))
    continue
  }
  chapterNo++
  const titleSimp = toSimp(c.title)
  out.chapters.push({
    chapterNo,
    title: titleSimp,
    ref: '金匮要略·' + chapterRef(titleSimp),
    units: c.units.map((text, i) => {
      const simp = toSimp(text)
      return {
        id: '金匮' + chapterNo + '.' + (i + 1),
        chapterRef: '金匮要略·' + chapterRef(titleSimp),
        seq: i + 1,
        key: simp.slice(0, 18),       // 条文首句：在任何书/网站上都能直接检索到
        text: simp,
        status: 'pending'
      }
    }),
    formulas: c.formulas.map(toSimp)
  })
}

const totalUnits = out.chapters.reduce((n, c) => n + c.units.length, 0)
console.log('篇数:', out.chapters.length, '｜ 条文:', totalUnits, '｜ 繁简对照表:', Object.keys(tradMap).length, '字')

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

// ---- 繁体字体检：扫「原文」（繁体），列出既不在对照表、简体语料里也没出现过的字 ----
{
  const simpCorpus = new Set()
  const addText = t => { for (const ch of t) if (/[\u4e00-\u9fff]/.test(ch)) simpCorpus.add(ch) }
  const walk = dir => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue
      const p = path.join(dir, f.name)
      if (f.isDirectory()) { walk(p); continue }
      if (/\.(js|html|json|md)$/.test(f.name)) { try { addText(fs.readFileSync(p, 'utf8')) } catch (_) {} }
    }
  }
  walk(path.join(__dirname, '..', 'plugins'))
  walk(path.join(__dirname, '..', 'web'))
  for (const c of out.chapters) for (const u of c.units) addText(u.text)   // 已转换的简体

  const unknown = new Map()
  const rawBody = raw.replace(/^\s*=+.*$/gm, '')
  for (const ch of rawBody) {
    if (!/[\u4e00-\u9fff]/.test(ch)) continue
    if (tradMap[ch]) continue
    if (simpCorpus.has(ch)) continue
    unknown.set(ch, (unknown.get(ch) || 0) + 1)
  }
  const top = [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  if (top.length) {
    console.log('\n待确认的字（原文里的、不在对照表、简体语料也没有；是繁体就补进 繁简对照.json，本来就是同一个字的忽略）：')
    console.log('  ' + top.map(([c, n]) => c + '×' + n).join('  '))
  } else {
    console.log('\n繁体体检：没有可疑字 ✓')
  }
}
