'use strict'
// tools/extract-shanghanlun.js —— 把 Gutenberg《傷寒論》原文切成「条文级 JSON」
//
// 为什么要做：
//   金匮要略那边有 721 条逐条打 pending/done/skip 的凭证，伤寒论没有——
//   251 个节点都被标了 shanghanlun 出处，但拿不出「哪条做过、哪条跳过、为什么」的清单。
//   没有这个凭证，就没法一条一条地过条文补内容，也没法在出错时定位是「没做」还是「做错」。
//
// 输出：data/texts/伤寒论-条文.json
//   {
//     "source": "...",
//     "numbering": "宋本 398 条（原文自带序号）",
//     "chapters": [
//       { chapterNo, title, ref, skip, skipReason, units: [
//           { id:'伤寒1.1', chapterRef, seq, key, text, textSimp, status:'pending'|'skip' } ] }
//     ]
//   }
//
// 原文的几个坑（都是实跑踩出来的）：
//   1. 零有时写作「０」有时写作「Ｏ」（全角字母 O），还有用 ASCII「0」的
//   2. 条末分隔符既可能是「、」也可能是「，」
//   3. 有几条编号顶格（前面没有全角缩进）
//   4. 中间混进了 Gutenberg 的转义垃圾「&#0;」
// 所以不用「匹配所有行首编号」这种笨办法，改成**按顺序找下一条**：
// 已知当前条号是 n，就在后面找第一个「编号解出来正好等于 n+1」的行。
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'data', 'texts', '伤寒论-gutenberg.txt')
const OUT = path.join(ROOT, 'data', 'texts', '伤寒论-条文.json')
const MAP_FILE = path.join(ROOT, 'data', 'texts', '繁简对照.json')

// ---------- 一、编号解析 ----------
// 原文里的「零」有四种写法：ASCII 0、全角０、汉字〇、全角字母 Ｏ，
// 还有 ASCII 的 O/o（有些排版把 0 打成了字母）。全部当 0 处理。
const ZERO_CHARS = '0０〇OoＯｏ'
const NUM_CHARS = '一二三四五六七八九' + ZERO_CHARS
const DIGIT = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9
}
for (const z of ZERO_CHARS) DIGIT[z] = 0
/** 「一二八」→128；不是纯数字串就返回 null */
function cn2num(s) {
  const t = String(s).replace(/[\s　]/g, '')
  if (!t) return null
  let out = ''
  for (const ch of t) {
    if (ch in DIGIT) { out += DIGIT[ch]; continue }
    return null
  }
  return out === '' ? null : parseInt(out, 10)
}

// ---------- 二、篇章 ----------
// 「可/不可」那些篇全是主篇条文的重复抄录；辨脉法/平脉法/伤寒例是王叔和加的，
// 而且全是脉——本项目不做脉，所以这些篇整篇 skip，但要在 JSON 里留痕。
const CHAPTER_SKIP_REASON = {
  辨脈法: '脉法篇（王叔和增），本项目不做脉',
  平脈法: '脉法篇（王叔和增），本项目不做脉',
  傷寒例: '伤寒例（王叔和序例），非仲景原文',
  辨痙濕暍: '与金匮要略·痉湿暍病篇重复，已在金匮批次里处理',
  辨不可發汗: '可/不可诸篇为主篇条文的重复抄录',
  辨可發汗: '可/不可诸篇为主篇条文的重复抄录',
  辨發汗後: '可/不可诸篇为主篇条文的重复抄录',
  辨不可吐: '可/不可诸篇为主篇条文的重复抄录',
  辨可吐: '可/不可诸篇为主篇条文的重复抄录',
  辨不可下: '可/不可诸篇为主篇条文的重复抄录',
  辨可下: '可/不可诸篇为主篇条文的重复抄录',
  辨發汗吐下後: '可/不可诸篇为主篇条文的重复抄录'
}

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
/** 「第二十二」→22 */
function cnOrder(s) {
  const m = /第([一二三四五六七八九十]+)/.exec(s)
  if (!m) return null
  const t = m[1]
  if (t === '十') return 10
  if (t.length === 1) return CN_NUM[t] || null
  if (t[0] === '十') return 10 + (CN_NUM[t[1]] || 0)
  if (t[1] === '十') return (CN_NUM[t[0]] || 0) * 10 + (t[2] ? (CN_NUM[t[2]] || 0) : 0)
  return null
}

// ---------- 二·五、条文里点到的方名 ----------
// 逐条审核时最想知道的是「这条说的是哪个方」，先粗抽出来当线索用（不保证认全）。
const FORMULA_TAIL = '湯散丸圓煎酒膏'
// 方名前面常粘着的动词/虚词，抽出来以后一层层剥掉
const NAME_PREFIX = '用與与服宜可先後后更凡若属屬以然此即復复再仍不飲饮'
function formulaNames(text) {
  const out = new Set()
  const re = new RegExp('([\\u4e00-\\u9fff]{2,12}[' + FORMULA_TAIL + '])(?=主之|方|，宜|，與|。|；|$|證)', 'g')
  let m
  while ((m = re.exec(text))) {
    let name = m[1]
    // 一层层剥掉前缀（「先與小柴胡湯」「可與甘草湯」「凡柴胡湯」）
    let changed = true
    while (changed && name.length > 2) {
      changed = false
      if (NAME_PREFIX.includes(name[0])) { name = name.slice(1); changed = true }
    }
    if (name.length < 2) continue
    if (!new RegExp('[' + FORMULA_TAIL + ']$').test(name)) continue
    // 「不可與瓜蒂散」剥完是「瓜蒂散」，但「不可更行桂枝湯」会剥成「行桂枝湯」——这类先留着，
    // 审核时看到能自己判断，只要不静默丢掉就行。
    out.add(name)
  }
  return [...out]
}

// ---------- 三、繁简 ----------
function loadSimpMap() {
  const j = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'))
  return j.map || {}
}
function toSimp(text, map, missing) {
  let out = ''
  for (const ch of text) {
    if (ch in map) { out += map[ch]; continue }
    out += ch
    // 记录没覆盖到的 CJK 字，方便后面补表
    const c = ch.codePointAt(0)
    if (c >= 0x3400 && c <= 0x9fff) missing.add(ch)
  }
  return out
}

// ---------- 四、主流程 ----------
function main() {
  let raw = fs.readFileSync(SRC, 'utf8')
  // Gutenberg 的转义垃圾：原文有两处编号被拆坏了
  //   第 110 条写成「&#0;一 0 」（宋本该是「一一０」）
  //   第 311 条写成「三&#0;一」（宋本该是「三一一」）
  // 按宋本编号还原。
  raw = raw.replace(/&#0;/g, '一')
  // 去掉 Project Gutenberg 的头尾
  const startMark = '*** START OF THE PROJECT GUTENBERG EBOOK'
  const endMark = '*** END OF THE PROJECT GUTENBERG EBOOK'
  const si = raw.indexOf(startMark)
  const ei = raw.indexOf(endMark)
  if (si >= 0) raw = raw.slice(raw.indexOf('\n', si) + 1)
  if (ei >= 0) raw = raw.slice(0, raw.indexOf('\n*** END') >= 0 ? raw.length : raw.length)
  raw = raw.replace(/\r/g, '')
  const lines = raw.split('\n')

  // 4.1 找篇章标题行
  const chapters = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!/^(辨|平脈法|傷寒例).*第[一二三四五六七八九十]+$/.test(t)) continue
    const order = cnOrder(t)
    if (!order) continue
    // 去掉「第五」这类序号后缀，得到篇名
    const name = t.replace(/第[一二三四五六七八九十]+$/, '')
    const skipKey = Object.keys(CHAPTER_SKIP_REASON).find(k => name.startsWith(k))
    chapters.push({
      chapterNo: order,
      title: t,
      name,
      ref: '伤寒论·' + name,
      skip: !!skipKey,
      skipReason: skipKey ? CHAPTER_SKIP_REASON[skipKey] : null,
      startLine: i,
      units: []
    })
  }
  for (let i = 0; i < chapters.length; i++) {
    chapters[i].endLine = i + 1 < chapters.length ? chapters[i + 1].startLine : lines.length
  }

  // 4.2 按「下一条编号 = 当前+1」的顺序切条
  // 编号内部允许夹空格：原文把 20 写成「二 0 」、把 130 写成「一三Ｏ」，
  // 所以先把「取一段可能是编号的文本」放宽，交给 cn2num 去掉空白后判断。
  const numClass = '[' + NUM_CHARS + '][' + NUM_CHARS + '\\s　]{0,10}?'
  const NUM_RE = new RegExp('^[\\s　]*(' + numClass + ')[\\s　]*[、，]')
  let seq = 1
  let cur = null
  const allUnits = []
  for (let i = 0; i < lines.length; i++) {
    const m = NUM_RE.exec(lines[i])
    if (m) {
      const n = cn2num(m[1])
      if (n === seq) {
        if (cur) { cur.endLine = i - 1; allUnits.push(cur) }
        cur = { seq: n, startLine: i, lines: [lines[i].replace(NUM_RE, '')] }
        seq++
        continue
      }
    }
    if (cur) cur.lines.push(lines[i])
  }
  if (cur) { cur.endLine = lines.length - 1; allUnits.push(cur) }

  // 4.3 归到篇章
  const map = loadSimpMap()
  const missing = new Set()
  const chapterStarts = chapters.map(c => c.startLine).sort((a, b) => a - b)
  for (const u of allUnits) {
    const ch = chapters.find(c => u.startLine >= c.startLine && u.startLine < c.endLine)
    if (!ch) { console.warn('条 ' + u.seq + ' 找不到所属篇章（第 ' + u.startLine + ' 行）'); continue }
    // 正文：把折行拼回去，去掉方剂组成/煎服法（那些不是「条文」）。
    // 注意要在「下一篇标题行」处截断——否则最后一条会把后面所有篇的内容都吞进来。
    const nextChapter = chapterStarts.find(s => s > u.startLine)
    const stopLine = nextChapter !== undefined ? nextChapter : u.lines.length + u.startLine
    const bodyLines = []
    for (let k = 0; k < u.lines.length; k++) {
      if (u.startLine + k >= stopLine) break
      bodyLines.push(u.lines[k])
    }
    const body = bodyLines
      .map(x => x.trim())
      .filter(x => x.length > 0)
      .join('')
    // 条文到第一个「××湯方」为止（方后注不进货真）
    const cutIdx = body.search(/[^\s。；]{1,12}湯方(?![主之])/)
    const tiaoText = cutIdx >= 6 ? body.slice(0, cutIdx) : body
    ch.units.push({
      id: '伤寒' + ch.chapterNo + '.' + u.seq,
      chapterRef: ch.ref,
      seq: u.seq,
      key: tiaoText.slice(0, 20),
      text: tiaoText,
      textSimp: toSimp(tiaoText, map, missing),
      // 这条条文点了哪些方子（供逐条审核时快速定位要查哪个插件）
      formulasHint: formulaNames(tiaoText),
      status: ch.skip ? 'skip' : 'pending'
    })
  }

  const out = {
    source: 'data/texts/伤寒论-gutenberg.txt（Project Gutenberg #24272，繁体）',
    numbering: '宋本 398 条，条文序号由原文自带（一、二、三……）',
    note: 'text 为原文（繁体），textSimp 用 data/texts/繁简对照.json 转写；对照表没覆盖的字会原样保留，tools/extract-shanghanlun.js 每次跑都会列出这些字。',
    chapters: chapters.map(c => ({
      chapterNo: c.chapterNo,
      title: c.title,
      ref: c.ref,
      skip: c.skip,
      skipReason: c.skipReason,
      units: c.units
    }))
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8')

  // ---------- 五、报告 ----------
  console.log('=== 伤寒论 条文抽取 ===')
  console.log('切出条文：' + allUnits.length + ' 条')
  const miss = []
  for (let k = 1; k <= 398; k++) if (!allUnits.some(u => u.seq === k)) miss.push(k)
  console.log('缺号：' + (miss.length ? miss.join(',') : '无 ✓'))
  console.log('')
  console.log('篇章：')
  let pendingCount = 0
  for (const c of chapters) {
    const st = c.skip ? 'skip' : '待处理'
    if (!c.skip) pendingCount += c.units.length
    console.log('  ' + String(c.chapterNo).padStart(2) + '. ' + c.title.padEnd(24) +
      String(c.units.length).padStart(4) + ' 条  ' + st + (c.skipReason ? '（' + c.skipReason + '）' : ''))
  }
  console.log('\n待处理条文合计：' + pendingCount + ' 条')
  if (missing.size) {
    console.log('\n繁简对照表没覆盖的字 ' + missing.size +
      ' 个（其中大部分本来就是简体，不影响阅读；只影响 textSimp 的完整度）')
  }
  console.log('\n已写入 ' + OUT)
}

main()
