'use strict'
// dev/lib/parse.js
// ============================================================
// 插件源码「解析 → 定点改写」工具（开发端专用，零依赖）
//
// 设计目标（这是整个开发端最关键的一环）：
//   插件文件里带着作者手写的条文注释，例如：
//       // 第26条: 服桂枝汤大汗出后大烦渴不解脉洪大者，白虎加人参汤主之。
//       needs: [['severe_thirst.yes', 'cold_aversion.no']],
//   因此保存时**绝不整文件重新生成**，只能：
//     1) 把源码扫描成「顶层成员 → 值区间」表；
//     2) 只替换语义上真的变化了的字段；
//     3) 新增成员插到对象末尾（保持项目的方法简写风格）；
//     4) 删除成员按整行删除（并连带紧贴其上的注释行）。
//   未被改动的字段、注释、空行、缩进全部原样保留。
//
//   自测（dev/selftest.js）保证：186 个现有文件「解析 → 回灌原值」字节级一致。
// ============================================================

// ------------------------------------------------------------
// 一、词法扫描
// ------------------------------------------------------------

function isSpace(c) {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\v'
}

function skipString(text, i) {
  const q = text[i]
  i++
  while (i < text.length) {
    const c = text[i]
    if (c === '\\') { i += 2; continue }
    if (c === q) return i + 1
    i++
  }
  return i
}

function skipLineComment(text, i) {
  const n = text.indexOf('\n', i)
  return n === -1 ? text.length : n
}

function skipBlockComment(text, i) {
  const n = text.indexOf('*/', i + 2)
  return n === -1 ? text.length : n + 2
}

/** 从 open 位置找到配对的 close，返回 close 之后的位置（跳过字符串与注释） */
function findMatching(text, i, open, close) {
  let depth = 0
  while (i < text.length) {
    const c = text[i]
    if (c === '"' || c === "'" || c === '`') { i = skipString(text, i); continue }
    if (c === '/' && text[i + 1] === '/') { i = skipLineComment(text, i); continue }
    if (c === '/' && text[i + 1] === '*') { i = skipBlockComment(text, i); continue }
    if (c === open) { depth++; i++; continue }
    if (c === close) {
      depth--
      i++
      if (depth === 0) return i
      continue
    }
    i++
  }
  return -1
}

/** 找一个值的结束位置：括号类到配对符号后；字符串到引号后；其它到行尾/顶层逗号 */
function scanValueEnd(text, i) {
  const c = text[i]
  if (c === '[') return findMatching(text, i, '[', ']')
  if (c === '{') return findMatching(text, i, '{', '}')
  if (c === '(') return findMatching(text, i, '(', ')')
  if (c === '"' || c === "'" || c === '`') return skipString(text, i)
  let j = i
  while (j < text.length) {
    const ch = text[j]
    if (ch === ',' || ch === '}' || ch === '\n') break
    if (ch === '/' && text[j + 1] === '/') break
    j++
  }
  return j
}

function lineStart(text, i) {
  const n = text.lastIndexOf('\n', i - 1)
  return n === -1 ? 0 : n + 1
}

function lineEnd(text, i) {
  const n = text.indexOf('\n', i)
  if (n === -1) return text.length
  return text[n - 1] === '\r' ? n - 1 : n
}

// ------------------------------------------------------------
// 二、解析 module.exports = { … } 的顶层成员
// ------------------------------------------------------------

/**
 * 返回 {
 *   ok, bodyStart, bodyEnd, indent,
 *   fields: { key: { key, keyStart, valueStart, valueEnd, entryEnd,
 *                    commentStart, method, hasColon } },
 *   model:  { name,title,kind,ask,needs,contraindications, meta }
 * }
 * 非标准写法 → ok:false（调用方应把该节点设为只读）
 */
function scanPluginSource(text) {
  const mm = /module\.exports\s*=\s*\{/.exec(text)
  if (!mm) return { ok: false, reason: '找不到 module.exports = { … } 形式' }
  const objStart = text.indexOf('{', mm.index)
  const bodyEnd = findMatching(text, objStart, '{', '}')
  if (bodyEnd === -1) return { ok: false, reason: '对象字面量括号不配对' }

  const fields = {}
  let i = objStart + 1
  let indent = null

  while (i < bodyEnd) {
    let commentStart = -1
    let sawBlankLine = false
    while (i < bodyEnd) {
      const c = text[i]
      if (c === '\n') {
        const prevLine = text.slice(lineStart(text, i - 1), i)
        if (/^\s*$/.test(prevLine)) sawBlankLine = true
        i++
        continue
      }
      if (isSpace(c)) { i++; continue }
      if (text.startsWith('//', i)) { if (commentStart === -1) commentStart = i; i = skipLineComment(text, i); continue }
      if (text.startsWith('/*', i)) { if (commentStart === -1) commentStart = i; i = skipBlockComment(text, i); continue }
      break
    }
    if (i >= bodyEnd) break

    const keyStart = i
    let key
    if (text[i] === '"' || text[i] === "'") {
      const end = skipString(text, i)
      key = text.slice(i + 1, end - 1)
      i = end
    } else {
      const m = /^[A-Za-z_$][\w$]*/.exec(text.slice(i, i + 64))
      if (!m) { i++; continue }
      key = m[0]
      i += m[0].length
    }
    while (i < bodyEnd && isSpace(text[i])) i++

    let valueStart = -1
    let valueEnd = -1
    let method = false
    let hasColon = false

    if (text[i] === '(') {
      // 方法简写：trigger(text) { … }
      const pEnd = findMatching(text, i, '(', ')')
      let j = pEnd
      while (isSpace(text[j])) j++
      method = true
      valueStart = i
      valueEnd = text[j] === '{' ? findMatching(text, j, '{', '}') : pEnd
    } else if (text[i] === ':') {
      hasColon = true
      i++
      while (i < bodyEnd && isSpace(text[i])) i++
      valueStart = i
      valueEnd = scanValueEnd(text, i)
    } else {
      i = scanValueEnd(text, i)
      continue
    }
    if (valueEnd === -1) break

    if (indent === null) {
      const ls = lineStart(text, keyStart)
      const ind = text.slice(ls, keyStart)
      if (/^[ \t]+$/.test(ind)) indent = ind
    }

    let k = valueEnd
    while (k < text.length && (text[k] === ' ' || text[k] === '\t' || text[k] === '\r')) k++
    let entryEnd = valueEnd
    if (text[k] === ',') entryEnd = k + 1

    fields[key] = {
      key, keyStart, valueStart, valueEnd, entryEnd, method, hasColon,
      commentStart: sawBlankLine ? -1 : commentStart
    }
    i = entryEnd > valueEnd ? entryEnd : valueEnd
  }

  return { ok: true, bodyStart: objStart, bodyEnd, indent: indent || '  ', fields, model: modelFromScan(text, fields) }
}

function rawOf(text, rec) {
  return rec && rec.valueStart >= 0 ? text.slice(rec.valueStart, rec.valueEnd) : null
}

// ------------------------------------------------------------
// 三、字面量解析（安全，不用 eval）
// ------------------------------------------------------------

function unquote(raw) {
  let out = ''
  for (let i = 1; i < raw.length - 1; i++) {
    const c = raw[i]
    if (c === '\\') {
      const n = raw[i + 1]
      i++
      if (n === 'n') out += '\n'
      else if (n === 't') out += '\t'
      else if (n === 'r') out += '\r'
      else if (n === 'u') { out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 5), 16)); i += 4 }
      else out += n
    } else out += c
  }
  return out
}

/**
 * 去掉注释（尊重字符串字面量）。
 * 项目里确实存在「数组内部带行注释」的写法，例如
 *   needs: [
 *     // (1) 发汗已 后：身灼热
 *     ['sweat.yes','burning.yes'],
 *   ]
 * 解析字面量时必须先把注释剔掉，否则这两类文件会被误判为「自定义写法」而无法编辑。
 */
function stripComments(src) {
  let out = ''
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '"' || c === "'" || c === '`') {
      const end = skipString(src, i)
      out += src.slice(i, end)
      i = end
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      const end = skipLineComment(src, i)
      out += ' '
      i = end
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = skipBlockComment(src, i)
      out += ' '
      i = end
      continue
    }
    out += c
    i++
  }
  return out
}

/** 值区间里是否含注释（改写会连带删掉它，需要提醒作者） */
function countCommentLines(raw) {
  if (!raw) return 0
  let n = 0
  let i = 0
  while (i < raw.length) {
    const c = raw[i]
    if (c === '"' || c === "'" || c === '`') { i = skipString(raw, i); continue }
    if (c === '/' && raw[i + 1] === '/') { n++; i = skipLineComment(raw, i); continue }
    if (c === '/' && raw[i + 1] === '*') { n++; i = skipBlockComment(raw, i); continue }
    i++
  }
  return n
}

/** 解析纯字面量（数组 / 字符串 / 数字 / 布尔 / null，允许夹杂注释），失败抛错 */
function parseLiteral(src) {
  src = stripComments(src)
  let i = 0
  function ws() { while (i < src.length && isSpace(src[i])) i++ }
  function value() {
    ws()
    const c = src[i]
    if (c === '[') {
      i++
      const arr = []
      ws()
      if (src[i] === ']') { i++; return arr }
      for (;;) {
        arr.push(value())
        ws()
        if (src[i] === ',') { i++; continue }
        if (src[i] === ']') { i++; return arr }
        throw new Error('数组字面量格式异常: ' + src.slice(0, 60))
      }
    }
    if (c === '"' || c === "'" || c === '`') {
      const end = skipString(src, i)
      const raw = src.slice(i, end)
      i = end
      return unquote(raw)
    }
    const rest = src.slice(i)
    let m
    if ((m = /^-?\d+(\.\d+)?/.exec(rest))) { i += m[0].length; return Number(m[0]) }
    if ((m = /^(true|false|null)\b/.exec(rest))) { i += m[0].length; return m[0] === 'null' ? null : m[0] === 'true' }
    throw new Error('无法解析的字面量: ' + rest.slice(0, 40))
  }
  const v = value()
  return v
}

function litString(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n') + "'"
}

function litArray(arr) {
  return '[' + arr.map(v => (typeof v === 'string' ? litString(v) : String(v))).join(', ') + ']'
}

// ------------------------------------------------------------
// 四、字段语义
// ------------------------------------------------------------

/** 从 trigger/negate 的值源码里抽关键词数组；不是「统一写法」则返回 null */
function keywordArrayFromValue(raw) {
  if (!raw) return null
  const clean = stripComments(raw)
  const m = /\[\s*([\s\S]*?)\s*\]\s*\.some\s*\(/.exec(clean)
  if (!m) return null
  try {
    const arr = parseLiteral('[' + m[1] + ']')
    return Array.isArray(arr) ? arr.map(String) : null
  } catch (_) {
    return null
  }
}

function condToRef(cond) {
  const s = String(cond)
  if (s.endsWith('.yes')) return { ref: s.slice(0, -4), pol: 'yes' }
  if (s.endsWith('.no')) return { ref: s.slice(0, -3), pol: 'no' }
  return { ref: s, pol: 'yes' }
}

function refToCond(c) {
  return c.ref + (c.pol === 'no' ? '.no' : '.yes')
}

/** needs 源码 → 路径数组 [[{ref,pol}]]；非字面量返回 null */
function needsToPaths(needsRaw) {
  if (!needsRaw) return []
  let lit
  try { lit = parseLiteral(needsRaw) } catch (_) { return null }
  if (!Array.isArray(lit)) return null
  const paths = Array.isArray(lit[0]) ? lit : [lit]
  return paths.map(p => (Array.isArray(p) ? p : [p]).map(condToRef))
}

/** 路径数组 → needs 字面量（单路径写平铺，多路径写嵌套，贴合现有风格） */
function needsLiteral(paths) {
  const clean = (paths || []).filter(p => p && p.length).map(p => p.map(refToCond))
  if (!clean.length) return null
  if (clean.length === 1) return litArray(clean[0])
  return '[\n' + clean.map(p => '    ' + litArray(p)).join(',\n') + '\n  ]'
}

/** 方法简写的 trigger/negate 成员体，例如 (text) { return [...].some(k => text.includes(k)) } */
function predicateBody(kws) {
  return '(text) { return ' + litArray(kws) + '.some(k => text.includes(k)) }'
}

/** ─ 供外部（graph.js）生成整段成员源码 ─ */
function methodMember(fnName, kws) {
  return fnName + predicateBody(kws)
}
function propMember(key, literal) {
  return key + ': ' + literal
}

// ------------------------------------------------------------
// 五、语义模型
// ------------------------------------------------------------

function modelFromScan(text, fields) {
  const get = k => rawOf(text, fields[k])
  const str = k => {
    const r = get(k)
    if (!r) return null
    try { const v = parseLiteral(r); return typeof v === 'string' ? v : null } catch (_) { return null }
  }

  const triggerRaw = get('trigger')
  const negateRaw = get('negate')
  const triggerKws = keywordArrayFromValue(triggerRaw)
  const negateKws = keywordArrayFromValue(negateRaw)
  const needsRaw = get('needs')
  const paths = needsToPaths(needsRaw)

  const contraRaw = get('contraindications')
  let contra = []
  if (contraRaw) {
    try {
      const v = parseLiteral(contraRaw)
      contra = Array.isArray(v) ? v.map(String) : [String(v)]
    } catch (_) { contra = [] }
  }

  return {
    name: str('name'),
    title: str('title'),
    kind: str('kind'),
    ask: str('ask'),
    needs: paths === null ? [] : paths,
    contraindications: contra,
    meta: {
      has: {
        name: !!fields.name, title: !!fields.title, kind: !!fields.kind,
        trigger: !!fields.trigger, negate: !!fields.negate, ask: !!fields.ask,
        needs: !!fields.needs, contraindications: !!fields.contraindications
      },
      triggerMode: !triggerRaw ? 'none' : (triggerKws ? 'keywords' : 'custom'),
      negateMode: !negateRaw ? 'none' : (negateKws ? 'keywords' : 'custom'),
      needsMode: !needsRaw ? 'none' : (paths === null ? 'custom' : (paths.length > 1 ? 'or' : 'and')),
      triggerKws: triggerKws || [],
      negateKws: negateKws || [],
      triggerRaw, negateRaw, needsRaw, contraRaw
    }
  }
}

// ------------------------------------------------------------
// 六、定点改写
// ------------------------------------------------------------

function deepEqual(a, b) {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
    return true
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    for (const k of ka) if (!deepEqual(a[k], b[k])) return false
    return true
  }
  return false
}

function pathsEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j].ref !== b[i][j].ref || a[i][j].pol !== b[i][j].pol) return false
    }
  }
  return true
}

/**
 * 按期望模型改写源码，只动真正变化的字段。
 * desired 里出现的键才参与改写；字符串字段给 null/'' 表示删除。
 * opts.defaults：字段缺失时视为等价于该默认值（例如症状文件没有 kind，
 *   目录已隐含 kind:'symptom'，此时不应凭空插入 kind）。
 * 返回 { text, changed, changedFields, notes }
 */
function patchPluginSource(text, desired, opts) {
  const options = opts || {}
  const defaults = options.defaults || {}
  const scan = scanPluginSource(text)
  if (!scan.ok) return { text, changed: false, changedFields: [], notes: ['非标准插件写法，未改动: ' + scan.reason] }

  const { fields, bodyEnd, indent } = scan
  const cur = scan.model
  const reps = []      // { start, end, text }
  const inserts = []   // { text }  —— text 为完整成员源码（不含缩进）
  const changedFields = []
  const notes = []

  // 替换已存在成员的值区间；method 为真时只需写 (args){body}
  const replaceValue = (key, bodyText) => {
    const rec = fields[key]
    const before = text.slice(rec.valueStart, rec.valueEnd)
    const cn = countCommentLines(before)
    if (cn > 0) notes.push(`${key} 原值里含 ${cn} 行注释（例如路径说明），改写后会一并移除——请在 diff 预览里确认`)
    if (before === bodyText) return
    reps.push({ start: rec.valueStart, end: rec.valueEnd, text: bodyText })
    changedFields.push(key)
  }

  const insertMember = (key, memberSrc) => {
    inserts.push({ key, text: memberSrc })
    changedFields.push(key + ':new')
  }

  const drop = key => {
    const rec = fields[key]
    if (!rec) return
    const start = lineStart(text, rec.commentStart >= 0 ? rec.commentStart : rec.keyStart)
    const tail = text.slice(rec.entryEnd, lineEnd(text, rec.entryEnd))
    let end
    if (/^\s*$/.test(tail)) {
      end = lineEnd(text, rec.entryEnd)
      if (text[end] === '\r' && text[end + 1] === '\n') end += 2
      else if (text[end] === '\n') end += 1
    } else {
      end = rec.entryEnd
      notes.push(`字段 ${key} 行尾还有注释，已保留该注释`)
    }
    reps.push({ start, end, text: '' })
    changedFields.push(key + ':removed')
  }

  // ---- 字符串字段 ----
  for (const key of ['name', 'title', 'kind', 'ask']) {
    if (!(key in desired)) continue
    const want = desired[key]
    const rec = fields[key]
    if (want === null || want === undefined || want === '') {
      if (rec) drop(key)
      continue
    }
    if (!rec) {
      if (cur[key] === want) continue
      if (defaults[key] !== undefined && defaults[key] === want) continue
      insertMember(key, propMember(key, litString(want)))
      continue
    }
    if (cur[key] === want) continue
    replaceValue(key, litString(want))
  }

  // ---- trigger / negate ----
  for (const key of ['trigger', 'negate']) {
    if (!(key in desired)) continue
    const want = desired[key]
    const rec = fields[key]
    const mode = key === 'trigger' ? cur.meta.triggerMode : cur.meta.negateMode
    if (want === null || (Array.isArray(want) && want.length === 0)) {
      if (rec) drop(key)
      continue
    }
    if (!Array.isArray(want)) continue
    if (mode === 'custom') {
      notes.push(`${key} 是自定义函数写法，界面不改动它`)
      changedFields.push(key + ':skipped-custom')
      continue
    }
    if (mode === 'keywords') {
      const now = key === 'trigger' ? cur.meta.triggerKws : cur.meta.negateKws
      if (deepEqual(now, want)) continue
      replaceValue(key, predicateBody(want))
    } else {
      insertMember(key, methodMember(key, want))
    }
  }

  // ---- needs ----
  if ('needs' in desired) {
    const want = desired.needs || []
    const rec = fields.needs
    if (cur.meta.needsMode === 'custom') {
      notes.push('needs 不是标准字面量写法，界面不改动它')
      changedFields.push('needs:skipped-custom')
    } else if (!want.filter(p => p && p.length).length) {
      if (rec) drop('needs')
    } else if (!pathsEqual(cur.needs, want)) {
      const lit = needsLiteral(want)
      if (lit) {
        if (rec) replaceValue('needs', lit)
        else insertMember('needs', propMember('needs', lit))
      }
    }
  }

  // ---- contraindications ----
  if ('contraindications' in desired) {
    const want = desired.contraindications
    const rec = fields.contraindications
    if (want === null || (Array.isArray(want) && want.length === 0)) {
      if (rec) drop('contraindications')
    } else if (Array.isArray(want)) {
      if (!deepEqual(cur.contraindications, want) || !rec) {
        if (rec) replaceValue('contraindications', litArray(want))
        else insertMember('contraindications', propMember('contraindications', litArray(want)))
      }
    }
  }

  if (!reps.length && !inserts.length) return { text, changed: false, changedFields, notes }

  // 应用替换（倒序，避免位移）
  let out = text
  for (const e of reps.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end)
  }

  // 应用插入：定位到对象体末尾
  if (inserts.length) {
    const rescan = scanPluginSource(out)
    const anchorBrace = (rescan.ok ? rescan.bodyEnd : bodyEnd) - 1   // '}' 的位置
    const ind = rescan.ok ? rescan.indent : indent
    let p = anchorBrace
    while (p > 0 && isSpace(out[p - 1])) p--
    const prevChar = out[p - 1]
    const needComma = prevChar !== ',' && prevChar !== '{'
    const lines = inserts.map((e, idx) => ind + e.text + (idx === inserts.length - 1 ? '' : ','))
    out = out.slice(0, p) + (needComma ? ',' : '') + '\n' + lines.join('\n') + out.slice(p)
  }

  return { text: out, changed: out !== text, changedFields, notes }
}

// ------------------------------------------------------------
// 七、引用改写（保留注释与排版）
// ------------------------------------------------------------

/** 用与原字面量相同的引号风格重新引用一个字符串 */
function quoteLike(raw, value) {
  const q = raw[0] === '"' ? '"' : "'"
  const esc = String(value).replace(/\\/g, '\\\\')
  return q + (q === "'" ? esc.replace(/'/g, "\\'") : esc.replace(/"/g, '\\"')) + q
}

/** 列出窗口内（尊重字符串/注释）所有字符串字面量的位置 */
function listLiterals(span) {
  const out = []
  let i = 0
  while (i < span.length) {
    const c = span[i]
    if (c === '"' || c === "'" || c === '`') { const end = skipString(span, i); out.push({ start: i, end, raw: span.slice(i, end) }); i = end; continue }
    if (c === '/' && span[i + 1] === '/') { i = skipLineComment(span, i); continue }
    if (c === '/' && span[i + 1] === '*') { i = skipBlockComment(span, i); continue }
    i++
  }
  return out
}

/** 删除 [start,end) 这段，并连带吃掉紧邻的一个逗号，避免留下 ", ," 或 ", ]" */
function removeElement(span, start, end) {
  let s = start, e = end
  // 优先吃后面的逗号
  let j = e
  while (j < span.length && (span[j] === ' ' || span[j] === '\t')) j++
  if (span[j] === ',') {
    e = j + 1
    // 连带吃掉该元素所在行的尾部空白
    while (e < span.length && (span[e] === ' ' || span[e] === '\t')) e++
    return span.slice(0, s) + span.slice(e)
  }
  // 否则吃前面的逗号
  let k = s - 1
  while (k >= 0 && (span[k] === ' ' || span[k] === '\t')) k--
  if (span[k] === ',') s = k
  return span.slice(0, s) + span.slice(e)
}

/** 反复清理「空路径数组」（内容只剩空白/逗号的 [] 或 [[]]），避免留下永真路径 */
function cleanEmptyPaths(span) {
  let changed = true
  while (changed) {
    changed = false
    const stack = []
    let i = 0
    while (i < span.length) {
      const c = span[i]
      if (c === '"' || c === "'" || c === '`') { i = skipString(span, i); continue }
      if (c === '/' && span[i + 1] === '/') { i = skipLineComment(span, i); continue }
      if (c === '/' && span[i + 1] === '*') { i = skipBlockComment(span, i); continue }
      if (c === '[') { stack.push(i); i++; continue }
      if (c === ']') {
        const open = stack.pop()
        if (open === undefined) { i++; continue }
        const inner = stripComments(span.slice(open + 1, i))
        const isEmpty = /^[\s,]*$/.test(inner)
        // 只清理嵌套层（外层整个数组为空的情况由调用方处理）
        if (isEmpty && stack.length > 0) {
          span = removeElement(span, open, i + 1)
          changed = true
          break
        }
        i++
        continue
      }
      i++
    }
  }
  return span
}

/**
 * 只改写 needs 里的引用名（改名）或删除条件（删除节点）：
 *   · 逐个字符串字面量替换，数组内的注释、缩进、逗号风格全部保留
 *   · 某条路径的条件被删空 → 整条路径移除
 *   · 所有条件都没了 → 整个 needs 成员移除
 */
function rewriteNeedsRefs(text, opts) {
  const options = opts || {}
  const renameMap = options.renameMap || {}
  const deleteSet = options.deleteSet instanceof Set ? options.deleteSet : new Set(options.deleteSet || [])
  const notes = []

  const scan = scanPluginSource(text)
  if (!scan.ok) return { text, changed: false, notes: ['源码非标准写法，跳过引用改写'] }
  const rec = scan.fields.needs
  if (!rec) return { text, changed: false, notes: [] }
  if (scan.model.meta.needsMode === 'custom') {
    return { text, changed: false, notes: ['needs 不是标准字面量写法，引用未自动改写，请手动处理'] }
  }

  let span = text.slice(rec.valueStart, rec.valueEnd)
  const before = span
  let commentLines = countCommentLines(span)

  // 1) 字面量级 改名 / 删除
  const lits = listLiterals(span)
  const ops = []
  for (const L of lits) {
    const val = unquote(L.raw)
    const m = /^([A-Za-z_$][\w$]*)(\.(yes|no))?$/.exec(val)
    if (!m) continue
    const ref = m[1]
    const suffix = m[2] || ''
    if (renameMap[ref]) ops.push({ start: L.start, end: L.end, text: quoteLike(L.raw, renameMap[ref] + suffix) })
    else if (deleteSet.has(ref)) ops.push({ start: L.start, end: L.end, text: null })
  }
  for (const op of ops.sort((a, b) => b.start - a.start)) {
    if (op.text === null) span = removeElement(span, op.start, op.end)
    else span = span.slice(0, op.start) + op.text + span.slice(op.end)
  }

  // 2) 清理空路径
  span = cleanEmptyPaths(span)

  // 3) 整个数组空了 → 删掉 needs 成员
  if (!/['"`]/.test(stripComments(span))) {
    const dropped = removeMember(text, 'needs')
    return { text: dropped, changed: true, notes: ['needs 里的条件已全部移除，该成员一并删除'] }
  }

  if (span === before) return { text, changed: false, notes: [] }

  // 尽量保持原长度感：把被删元素留下的空行清掉
  span = span.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')

  if (commentLines > 0) notes.push(`needs 数组内的 ${commentLines} 行注释已保留`)
  notes.push('引用已按「只改字符串」的方式更新（注释与排版未受影响）')

  return { text: text.slice(0, rec.valueStart) + span + text.slice(rec.valueEnd), changed: true, notes }
}

/** 删除某个顶层成员（连带紧贴其上的注释行） */
function removeMember(text, key) {
  const scan = scanPluginSource(text)
  if (!scan.ok) return text
  const rec = scan.fields[key]
  if (!rec) return text
  const start = lineStart(text, rec.commentStart >= 0 ? rec.commentStart : rec.keyStart)
  const tail = text.slice(rec.entryEnd, lineEnd(text, rec.entryEnd))
  let end
  if (/^\s*$/.test(tail)) {
    end = lineEnd(text, rec.entryEnd)
    if (text[end] === '\r' && text[end + 1] === '\n') end += 2
    else if (text[end] === '\n') end += 1
  } else {
    end = rec.entryEnd
  }
  return text.slice(0, start) + text.slice(end)
}

// ------------------------------------------------------------
// 八、新插件文件生成
// ------------------------------------------------------------

const DIR_OF_KIND = { symptom: 'symptoms', pulse: 'pulses', summary: 'syndromes', formula: 'formulas' }
const KIND_OF_DIR = { symptoms: 'symptom', pulses: 'pulse', syndromes: 'summary', formulas: 'formula' }

function generatePluginSource(model) {
  const kind = model.kind || 'symptom'
  const out = []
  out.push('module.exports = {')
  out.push('  name: ' + litString(model.name) + ',')
  out.push('  title: ' + litString(model.title) + ',')
  if (kind !== 'symptom' || model.forceKind) out.push('  kind: ' + litString(kind) + ',')

  const isLeaf = kind === 'symptom' || kind === 'pulse'
  if (isLeaf) {
    const kws = model.trigger || []
    if (kws.length) out.push('  ' + methodMember('trigger', kws) + ',')
    const neg = model.negate || []
    if (neg.length) out.push('  ' + methodMember('negate', neg) + ',')
    if (model.ask) out.push('  ask: ' + litString(model.ask) + ',')
  }
  const needs = (model.needs || []).filter(p => p && p.length)
  if (needs.length) out.push('  needs: ' + needsLiteral(needs) + ',')
  const contra = model.contraindications || []
  if (contra.length) out.push('  contraindications: ' + litArray(contra) + ',')

  out[out.length - 1] = out[out.length - 1].replace(/,$/, '')
  out.push('}')
  out.push('')
  return out.join('\n')
}

module.exports = {
  scanPluginSource,
  patchPluginSource,
  generatePluginSource,
  parseLiteral,
  stripComments,
  countCommentLines,
  rewriteNeedsRefs,
  removeMember,
  quoteLike,
  litString,
  litArray,
  needsLiteral,
  methodMember,
  propMember,
  predicateBody,
  keywordArrayFromValue,
  needsToPaths,
  condToRef,
  refToCond,
  deepEqual,
  pathsEqual,
  DIR_OF_KIND,
  KIND_OF_DIR
}
