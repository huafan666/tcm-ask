'use strict'
// dev/lib/graph.js
// ============================================================
// 开发端服务端：图模型 / 保存编排 / 引擎桥接
//
//  - buildGraph()     读盘 → 节点 + 统计（含源码语义元信息）
//  - computePlan()    算出「每个文件最终内容」+ diff + 结构校验（不写盘）
//  - previewSave()    computePlan 的对外包装（供界面预览）
//  - applySave()      备份 → 写盘 → 用 loader 复核
//  - simulate()       调用**真实引擎** engine.js 做状态推演
//  - explainNode()    逐路径逐条件解释 + 标记「路径冲突」
//  - walkthrough()    调用**真实 Asker** 回放问诊流程
//  - reverseTree()    以某节点为根的完整依赖树（条文反向视图）
//
// 安全设计：
//   · 只写 plugins/ 下的 .js 文件（路径全部由 name/kind 推导，不接受任意路径）
//   · 写盘前把「全部最终源码」写进临时目录并真跑一次 loader，语法/重名/悬空全过才落盘
//   · 原文件先备份到 dev/.backups/<时间戳>/
// ============================================================

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')

const ROOT = path.join(__dirname, '..', '..')
const PLUGINS = path.join(ROOT, 'plugins')
const LAYOUT_FILE = path.join(PLUGINS, '.layout.json')
const BACKUP_DIR = path.join(__dirname, '..', '.backups')

const P = require('./parse')
const provenance = require('./provenance')
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { Engine } = require(path.join(ROOT, 'engine/engine'))
const { Asker } = require(path.join(ROOT, 'engine/asker'))

const NAME_RE = /^[a-z][a-z0-9_]*$/

// ------------------------------------------------------------
// 基础工具
// ------------------------------------------------------------

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
}

function freshRegistry() {
  return loadAll(PLUGINS)
}

function nodePath(dir, file) {
  return path.join(PLUGINS, dir, file)
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/')
}

/** 极简行级 diff（文件只有几十行，直接 LCS） */
function lineDiff(before, after) {
  const a = before.split(/\r?\n/)
  const b = after.split(/\r?\n/)
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: ' ', s: a[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: '-', s: a[i] }); i++ }
    else { out.push({ t: '+', s: b[j] }); j++ }
  }
  while (i < n) { out.push({ t: '-', s: a[i] }); i++ }
  while (j < m) { out.push({ t: '+', s: b[j] }); j++ }
  return out
}

// ------------------------------------------------------------
// 一、读盘建图
// ------------------------------------------------------------

function buildGraph() {
  const { registry, byKind } = freshRegistry()
  const nodes = []
  const names = Object.keys(registry)

  for (const name of names) {
    const def = registry[name]
    const abs = nodePath(def.dir, def.file)
    let src = null
    let hash = null
    try {
      src = fs.readFileSync(abs, 'utf8')
      hash = sha256(src)
    } catch (_) { /* 下面按只读处理 */ }

    const scan = src === null ? { ok: false, reason: '文件不可读' } : P.scanPluginSource(src)
    const model = scan.ok ? scan.model : null

    nodes.push({
      name: def.name,
      title: def.title,
      kind: def.kind,
      dir: def.dir,
      file: def.file,
      isLeaf: def.kind === 'symptom' || def.kind === 'symptom_group' || def.kind === 'pulse',
      hasTrigger: typeof def.trigger === 'function',
      hasNeeds: !!(def.needs && def.needs.length),
      ask: model ? model.ask : (def.ask || null),
      trigger: model ? model.meta.triggerKws : [],
      negate: model ? model.meta.negateKws : [],
      // 症状筛选组：汇集的子症状名列表（只做粗筛）
      children: model ? (model.children || []) : (Array.isArray(def.children) ? def.children : []),
      needs: model ? model.needs : normalizeNeedsOf(def.needs),
      contraindications: model ? model.contraindications : (def.contraindications || []),
      modes: model
        ? { trigger: model.meta.triggerMode, negate: model.meta.negateMode, needs: model.meta.needsMode }
        : { trigger: 'custom', negate: 'custom', needs: 'custom' },
      fileHash: hash,
      editable: !!scan.ok,
      readOnlyReason: scan.ok ? null : scan.reason
    })
  }

  // ---- 条文来源（谁提供了这个节点）----
  const provView = provenance.load()
  provenance.attachTo(nodes, provView)
  const provAnnotated = nodes.filter(n => n.provenance).length

  // ---- 统计与结构检查（只报告，不改数据）----
  const byName = {}
  nodes.forEach(n => { byName[n.name] = n })

  const refCount = {}
  let orNodes = 0, noConds = 0, yesConds = 0, refs = 0
  const dangling = []
  const selfContra = []
  const selfRef = []

  for (const n of nodes) {
    if (!n.needs.length) continue
    if (n.needs.length > 1) orNodes++
    n.needs.forEach((p, pi) => {
      const seen = {}
      for (const c of p) {
        refs++
        refCount[c.ref] = (refCount[c.ref] || 0) + 1
        if (c.pol === 'no') noConds++; else yesConds++
        if (!byName[c.ref]) dangling.push({ from: n.name, to: c.ref, path: pi })
        if (c.ref === n.name) selfRef.push(n.name)
        if (seen[c.ref] && seen[c.ref] !== c.pol) selfContra.push({ node: n.name, path: pi, ref: c.ref })
        seen[c.ref] = c.pol
      }
    })
  }

  const leaves = nodes.filter(n => n.isLeaf)
  const orphans = leaves.filter(n => !refCount[n.name]).map(n => n.name)

  return {
    nodes,
    stats: {
      total: nodes.length,
      byKind: {
        symptom: (byKind.symptom || []).length,
        pulse: (byKind.pulse || []).length,
        summary: (byKind.summary || []).length,
        formula: (byKind.formula || []).length
      },
      refs, yesConds, noConds, orNodes,
      needNodes: nodes.filter(n => n.needs.length).length,
      leaves: leaves.length,
      orphans, dangling, selfContra, selfRef,
      provenance: {
        file: rel(provenance.FILE),
        annotated: provAnnotated,
        unannotated: nodes.length - provAnnotated,
        withRefs: nodes.filter(n => n.provenance && n.provenance.refs.length).length,
        sources: Object.keys(provView.sources || {})
      },
      orNodesList: nodes.filter(n => n.needs.length > 1).map(n => n.name),
      pluginsDir: PLUGINS.replace(/\\/g, '/'),
      root: ROOT.replace(/\\/g, '/'),
      layoutFile: rel(LAYOUT_FILE),
      backupDir: rel(BACKUP_DIR)
    },
    layout: readLayout(),
    dirs: P.DIR_OF_KIND,
    naturalKind: P.KIND_OF_DIR
  }
}

function normalizeNeedsOf(needs) {
  if (!needs || !needs.length) return []
  const paths = Array.isArray(needs[0]) ? needs : [needs]
  return paths.map(p => p.map(P.condToRef))
}

function readLayout() {
  try {
    if (!fs.existsSync(LAYOUT_FILE)) return { nodes: {}, viewport: null }
    const j = JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf8'))
    return { nodes: j.nodes || {}, viewport: j.viewport || null }
  } catch (_) {
    return { nodes: {}, viewport: null }
  }
}

function saveLayout(layout) {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    nodes: (layout && layout.nodes) || {},
    viewport: (layout && layout.viewport) || null
  }
  fs.writeFileSync(LAYOUT_FILE, JSON.stringify(payload, null, 2), 'utf8')
  return { ok: true, file: rel(LAYOUT_FILE), count: Object.keys(payload.nodes).length }
}

function readSource(name) {
  const { registry } = freshRegistry()
  const def = registry[name]
  if (!def) return { ok: false, error: '节点不存在: ' + name }
  const abs = nodePath(def.dir, def.file)
  return { ok: true, name, file: rel(abs), source: fs.readFileSync(abs, 'utf8') }
}

// ------------------------------------------------------------
// 二、保存编排
// ------------------------------------------------------------

/**
 * payload = {
 *   updated: [ { name, baseHash, title?, kind?, ask?, trigger?, negate?, needs?, contraindications? } ],
 *   created: [ { name, title, kind, trigger?, negate?, ask?, needs?, contraindications? } ],
 *   renamed: [ { from, to } ],
 *   deleted: [ { name, mode:'block'|'unlink' } ],
 *   layout?: { nodes, viewport }
 * }
 */
function computePlan(payload) {
  const errors = []
  const notes = []
  const { registry } = freshRegistry()
  const live = registry
  const liveNames = Object.keys(live)

  // 源码缓存
  const recOf = {}
  function rec(name) {
    if (recOf[name]) return recOf[name]
    const def = live[name]
    if (!def) return null
    const abs = nodePath(def.dir, def.file)
    const text = fs.readFileSync(abs, 'utf8')
    recOf[name] = { abs, text, hash: sha256(text), def }
    return recOf[name]
  }

  // ---------- 1. 校验：重命名 ----------
  const renameMap = {}
  for (const r of payload.renamed || []) {
    if (!live[r.from]) { errors.push(`重命名失败：节点不存在 ${r.from}`); continue }
    if (r.from === r.to) continue
    if (!NAME_RE.test(r.to)) { errors.push(`重命名目标不合法（小写字母/数字/下划线，字母开头）：${r.to}`); continue }
    if (live[r.to]) { errors.push(`重命名冲突：已存在节点 ${r.to}`); continue }
    renameMap[r.from] = r.to
  }

  // ---------- 2. 校验：删除 ----------
  const deleteSet = new Set()
  const deleteUsage = []
  for (const d of payload.deleted || []) {
    const name = typeof d === 'string' ? d : d.name
    if (!live[name]) { errors.push(`删除失败：节点不存在 ${name}`); continue }
    const users = []
    for (const n of liveNames) {
      const def = live[n]
      if (!def.needs || !def.needs.length) continue
      const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
      for (const p of paths) for (const c of p) {
        if (String(c).replace(/\.(yes|no)$/, '') === name) users.push(n)
      }
    }
    const mode = (typeof d === 'object' && d.mode) || 'block'
    if (users.length && mode === 'block') {
      errors.push(`节点 ${name} 仍被 ${users.length} 个节点引用（${users.slice(0, 6).join('、')}${users.length > 6 ? '…' : ''}）；请先解除引用，或选择「连引用一起删除」`)
      continue
    }
    deleteSet.add(name)
    if (users.length) deleteUsage.push({ name, users: [...new Set(users)] })
  }

  // ---------- 3. 校验：新增 ----------
  const createdList = []
  const createdNames = new Set()
  for (const c of payload.created || []) {
    if (!c || !c.name) { errors.push('新增节点缺少 name'); continue }
    if (!NAME_RE.test(c.name)) { errors.push(`新增节点 name 不合法：${c.name}（小写字母/数字/下划线，字母开头）`); continue }
    if (live[c.name]) { errors.push(`新增节点 name 已存在：${c.name}`); continue }
    if (createdNames.has(c.name)) { errors.push(`新增节点重复：${c.name}`); continue }
    if (!c.title) { errors.push(`新增节点缺少中文标题：${c.name}`); continue }
    if (!P.DIR_OF_KIND[c.kind]) { errors.push(`新增节点 kind 不合法：${c.kind}`); continue }
    createdNames.add(c.name)
    createdList.push(c)
  }

  // ---------- 4. 校验：needs 引用（按变更后的最终节点集合） ----------
  const finalNames = new Set(
    liveNames.filter(n => !deleteSet.has(n)).map(n => renameMap[n] || n)
  )
  for (const n of createdNames) finalNames.add(n)

  const norm = x => (x === undefined || x === null) ? null : x

  function checkNeeds(owner, needs, where) {
    if (!Array.isArray(needs)) { errors.push(`${where}：needs 必须是数组`); return }
    if (!needs.length) return
    needs.forEach((p, pi) => {
      if (!Array.isArray(p) || !p.length) { errors.push(`${where} 第 ${pi + 1} 条路径为空（请删除空路径或补条件）`); return }
      const seen = {}
      for (const c of p) {
        if (!c || !c.ref) { errors.push(`${where} 第 ${pi + 1} 条路径存在空条件`); continue }
        const target = renameMap[c.ref] || c.ref
        if (!finalNames.has(target)) { errors.push(`${where} 引用了不存在的节点：${c.ref}`); continue }
        if (target === (renameMap[owner] || owner)) { errors.push(`${where} 引用了自身：${c.ref}`); continue }
        if (c.pol !== 'yes' && c.pol !== 'no') { errors.push(`${where} 条件极性非法：${c.ref} (${c.pol})`); continue }
        if (seen[c.ref] && seen[c.ref] !== c.pol) errors.push(`${where} 第 ${pi + 1} 条路径自相矛盾：${c.ref} 同时要求 yes 与 no`)
        seen[c.ref] = c.pol
      }
    })
  }

  const updatedMap = {}
  for (const u of payload.updated || []) {
    if (!u || !u.name) { errors.push('更新项缺少 name'); continue }
    if (!live[u.name]) { errors.push(`更新失败：节点不存在 ${u.name}`); continue }
    if (deleteSet.has(u.name)) continue
    if ('title' in u && !u.title) { errors.push(`节点 ${u.name} 的标题不能为空`); continue }
    if ('kind' in u && !P.DIR_OF_KIND[u.kind]) { errors.push(`节点 ${u.name} 的 kind 不合法：${u.kind}`); continue }
    if ('needs' in u) checkNeeds(u.name, u.needs, `节点 ${u.name}`)
    updatedMap[u.name] = u
  }
  for (const c of createdList) {
    if ('needs' in c) checkNeeds(c.name, c.needs, `新节点 ${c.name}`)
    if ((c.kind === 'symptom' || c.kind === 'pulse') && (!c.trigger || !c.trigger.length)) {
      notes.push(`新节点「${c.title}」没有任何触发关键词：病人说的话永远不会激活它，只能靠反问确认`)
    }
  }
  if (errors.length) return { ok: false, errors, notes, files: [], layout: payload.layout || null }

  // ---------- 5. 计算每个节点最终源码 ----------
  const finalText = {}     // name -> 文本（null = 删除）
  const finalPath = {}     // name -> 绝对路径
  const fileNotes = {}     // abs -> [notes]

  const dirOfNode = {}
  for (const name of liveNames) dirOfNode[renameMap[name] || name] = live[name].dir

  for (const name of liveNames) {
    const r = rec(name)
    if (!r) continue
    const newName = renameMap[name] || name

    if (deleteSet.has(name)) { finalText[name] = null; finalPath[name] = r.abs; continue }

    let text = r.text
    const notesForFile = []

    // a) 重命名 → 改 name 字段
    if (newName !== name) {
      const res = P.patchPluginSource(text, { name: newName })
      text = res.text
      notesForFile.push(...res.notes)
    }

    // b) 字段更新（needs 留到 c 统一处理，避免两轮改写互相覆盖）
    const u = updatedMap[name]
    if (u) {
      const rescan0 = P.scanPluginSource(text)
      if (!rescan0.ok) {
        errors.push(`节点 ${name} 的源码不是标准写法，无法编辑保存：${rescan0.reason}`)
        continue
      }
      if (u.baseHash && u.baseHash !== r.hash && !renameMap[name]) {
        errors.push(`节点 ${name} 在磁盘上已被外部改动，请先点「重新载入」再改，避免覆盖你的手改内容`)
        continue
      }
      const desired = {}
      if ('title' in u) desired.title = u.title
      if ('kind' in u) desired.kind = u.kind
      if ('ask' in u) desired.ask = norm(u.ask)
      if ('trigger' in u) desired.trigger = norm(u.trigger)
      if ('negate' in u) desired.negate = norm(u.negate)
      if ('contraindications' in u) desired.contraindications = norm(u.contraindications)
      const res = P.patchPluginSource(text, desired, { defaults: { kind: P.KIND_OF_DIR[r.def.dir] } })
      text = res.text
      notesForFile.push(...res.notes)
    }

    // c) needs 的最终内容
    const scan2 = P.scanPluginSource(text)
    if (u && 'needs' in u) {
      // 作者在界面上明确改了条件 → 按模型整体写出
      if (scan2.ok && scan2.model.meta.needsMode === 'custom') {
        notesForFile.push(`节点 ${name} 的 needs 是自定义写法，界面不改动它`)
      } else if (scan2.ok) {
        const want = u.needs || []
        if (!P.pathsEqual(scan2.model.needs, want)) {
          const res = P.patchPluginSource(text, { needs: want })
          text = res.text
          notesForFile.push(...res.notes)
        }
      }
    } else if (Object.keys(renameMap).length || deleteSet.size) {
      // 只因改名/删除节点产生的引用变化 → 只替换字符串字面量，注释与排版原样保留
      const res = P.rewriteNeedsRefs(text, { renameMap, deleteSet })
      if (res.changed) {
        text = res.text
        notesForFile.push(...res.notes)
      }
    }

    // d) 最终文本的语义复检：空路径是「永真」陷阱，重复条件会让条文失去区分度
    const scan3b = P.scanPluginSource(text)
    if (scan3b.ok && scan3b.model.meta.needsMode !== 'custom') {
      scan3b.model.needs.forEach((p, pi) => {
        if (!p.length) {
          errors.push(`节点 ${name} 第 ${pi + 1} 条路径成了空路径（空路径会被引擎当作「永远成立」），已阻止保存`)
          return
        }
        const seen = {}
        for (const c of p) {
          if (seen[c.ref] === undefined) { seen[c.ref] = c.pol; continue }
          if (seen[c.ref] !== c.pol) errors.push(`节点 ${name} 第 ${pi + 1} 条路径自相矛盾：${c.ref} 同时要求 yes 与 no`)
          else notes.push(`提醒：节点 ${name} 第 ${pi + 1} 条路径里出现重复条件 ${c.ref}（改名或删除后可能产生），不影响运行但建议清理`)
        }
      })
    }

    finalText[name] = text
    // 目标路径：改名 和/或 改 kind（目录）都会改变文件位置
    const scan3 = P.scanPluginSource(text)
    const effectiveKind = (scan3.ok && scan3.model.kind) || P.KIND_OF_DIR[r.def.dir]
    const desiredKind = (u && u.kind) ? u.kind : effectiveKind
    const targetDir = P.DIR_OF_KIND[desiredKind] || r.def.dir
    const samePlace = (newName === name && targetDir === r.def.dir)
    finalPath[name] = samePlace ? r.abs : nodePath(targetDir, newName + '.js')
    fileNotes[r.abs] = notesForFile
  }

  if (errors.length) return { ok: false, errors, notes, files: [], layout: payload.layout || null }

  // 新建节点
  for (const c of createdList) {
    const dir = P.DIR_OF_KIND[c.kind]
    finalText[c.name] = P.generatePluginSource({
      name: c.name, title: c.title, kind: c.kind,
      trigger: c.trigger || [], negate: c.negate || [], ask: c.ask || null,
      needs: c.needs || [], contraindications: c.contraindications || []
    })
    finalPath[c.name] = nodePath(dir, c.name + '.js')
  }

  // ---------- 6. 组装文件清单 ----------
  const files = []
  const seenPath = new Map()
  for (const name of Object.keys(finalText)) {
    const text = finalText[name]
    const abs = finalPath[name]
    if (!abs) continue

    const isNew = createdNames.has(name)
    const origAbs = isNew ? null : rec(name).abs
    const movedFrom = origAbs && origAbs !== abs ? origAbs : null
    const beforeSrc = origAbs && fs.existsSync(origAbs) ? fs.readFileSync(origAbs, 'utf8') : ''
    const after = text === null ? '' : text

    let kindEff
    if (text === null) kindEff = 'delete'
    else if (isNew) kindEff = 'create'
    else if (movedFrom) kindEff = 'rename'
    else kindEff = 'modify'
    if (kindEff === 'modify' && beforeSrc === after) continue

    const key = abs.toLowerCase()
    if (seenPath.has(key)) { errors.push(`文件名冲突：${rel(abs)}`); continue }
    seenPath.set(key, name)

    const diff = lineDiff(beforeSrc, after)
    files.push({
      relPath: rel(movedFrom || (origAbs || abs)),
      toPath: movedFrom ? rel(abs) : null,
      kind: kindEff,
      node: name,
      before: beforeSrc,
      after,
      diff,
      changedLines: diff.filter(d => d.t !== ' ').length,
      notes: [...(fileNotes[origAbs || abs] || [])]
    })
  }
  files.sort((a, b) => a.relPath.localeCompare(b.relPath))

  if (deleteUsage.length) {
    notes.push('删除的节点会同时从这些引用处移除条件：' +
      deleteUsage.map(x => `${x.name}（被 ${x.users.length} 处引用：${x.users.slice(0, 4).join('、')}${x.users.length > 4 ? '…' : ''}）`).join('；'))
  }
  if (errors.length) return { ok: false, errors, notes, files: [], layout: payload.layout || null }

  return { ok: true, errors: [], notes, files, layout: payload.layout || null, _finalText: finalText, _finalPath: finalPath, _deleted: [...deleteSet] }
}

/** 把全部最终源码写进临时目录并真跑一次 loader —— 过了才允许落盘 */
function verifyPlan(plan) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tcm-verify-'))
  const problems = []
  try {
    for (const [name, text] of Object.entries(plan._finalText)) {
      if (text === null) continue
      const abs = plan._finalPath[name]
      const sub = path.basename(path.dirname(abs))
      const file = path.basename(abs)
      fs.mkdirSync(path.join(tmp, sub), { recursive: true })
      fs.writeFileSync(path.join(tmp, sub, file), text, 'utf8')
    }
    const origError = console.error
    const logs = []
    console.error = (...a) => { logs.push(a.join(' ')) }
    let loaded
    try {
      loaded = loadAll(tmp)
    } finally {
      console.error = origError
    }
    logs.forEach(l => problems.push(l.replace('[loader] ', '载入复核：')))

    const names = Object.keys(loaded.registry)
    const expected = Object.keys(plan._finalText).filter(n => plan._finalText[n] !== null)
    if (names.length !== expected.length) {
      problems.push(`载入复核：期望 ${expected.length} 个节点，实际 ${names.length} 个（有文件没被识别）`)
    }
    // 悬空引用
    for (const n of names) {
      const def = loaded.registry[n]
      if (!def.needs || !def.needs.length) continue
      const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
      for (const p of paths) for (const c of p) {
        const ref = String(c).replace(/\.(yes|no)$/, '')
        if (!loaded.registry[ref]) problems.push(`载入复核：${n} 引用了不存在的 ${ref}`)
      }
    }
    // 语法检查每个文件（require 已经在 loadAll 里做过，这里额外确保无残留）
  } catch (e) {
    problems.push('载入复核异常：' + e.message)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  return problems
}

function previewSave(payload) {
  const plan = computePlan(payload || {})
  if (!plan.ok) return plan
  if (plan.files.length) {
    const problems = verifyPlan(plan)
    if (problems.length) return { ok: false, errors: problems, notes: plan.notes, files: [] }
  }
  return plan
}

function applySave(payload) {
  const plan = previewSave(payload || {})
  if (!plan.ok) return plan

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const written = []
  const backups = []

  for (const f of plan.files) {
    const fromAbs = path.join(ROOT, f.relPath)
    if (f.kind === 'delete') {
      backup(fromAbs, f.before, stamp, backups)
      fs.unlinkSync(fromAbs)
      written.push({ relPath: f.relPath, action: 'deleted' })
      continue
    }
    if (f.kind === 'rename' && f.toPath) {
      const toAbs = path.join(ROOT, f.toPath)
      backup(fromAbs, f.before, stamp, backups)
      fs.writeFileSync(toAbs, f.after, 'utf8')
      fs.unlinkSync(fromAbs)
      written.push({ relPath: f.toPath, action: 'renamed', from: f.relPath })
      continue
    }
    const abs = path.join(ROOT, f.relPath)
    if (fs.existsSync(abs)) backup(abs, f.before, stamp, backups)
    fs.writeFileSync(abs, f.after, 'utf8')
    written.push({ relPath: f.relPath, action: f.before ? 'modified' : 'created' })
  }

  let layoutResult = null
  if (payload && payload.layout) layoutResult = saveLayout(payload.layout)

  // 落盘后复核
  const origError = console.error
  const logs = []
  console.error = (...a) => { logs.push(a.join(' ')) }
  let after
  try {
    after = freshRegistry()
  } finally {
    console.error = origError
  }

  if (logs.length) {
    return { ok: false, errors: logs.map(l => '落盘后复核发现问题：' + l), written, backups, layout: layoutResult, _partial: true }
  }

  return {
    ok: true,
    written,
    backups,
    layout: layoutResult,
    backupDir: rel(path.join(BACKUP_DIR, stamp)),
    verify: { loadedCount: Object.keys(after.registry).length }
  }
}

function backup(abs, text, stamp, list) {
  const bak = path.join(BACKUP_DIR, stamp, rel(abs).replace(/^plugins\//, ''))
  fs.mkdirSync(path.dirname(bak), { recursive: true })
  fs.writeFileSync(bak, text, 'utf8')
  list.push(rel(bak))
}

// ------------------------------------------------------------
// 三、引擎桥接
// ------------------------------------------------------------

function applyAssignments(engine, assignments) {
  for (const name of Object.keys(assignments || {}).sort()) {
    const v = assignments[name]
    if ((v === 'yes' || v === 'no') && engine.registry[name]) engine.setDirect(name, v)
  }
}

function simulate(assignments) {
  const { registry } = freshRegistry()
  const engine = new Engine(registry)
  applyAssignments(engine, assignments)

  const states = {}
  const explanations = {}
  for (const name of Object.keys(registry)) {
    states[name] = engine.state[name]
    const ex = explainNode(engine, registry, name)
    if (ex.paths.length) explanations[name] = ex
  }
  const asker = new Asker(engine)
  const cands = asker.candidates()
  return {
    states,
    explanations,
    candidates: cands.map(n => ({ name: n, title: registry[n].title })),
    nextQuestion: asker.nextQuestion(),
    yesFormulas: Object.entries(engine.state)
      .filter(([n, s]) => s === 'yes' && registry[n] && registry[n].kind === 'formula')
      .map(([n]) => ({ name: n, title: registry[n].title })),
    yesSummaries: Object.entries(engine.state)
      .filter(([n, s]) => s === 'yes' && registry[n] && registry[n].kind === 'summary')
      .map(([n]) => ({ name: n, title: registry[n].title })),
    contraindications: engine.contraindications(),
    conflicts: Object.values(explanations).filter(e => e.pathConflict).map(e => ({ name: e.name, title: e.title }))
  }
}

function explainNode(engine, registry, name) {
  const def = registry[name]
  const out = {
    name, title: def ? def.title : name, kind: def ? def.kind : null,
    status: engine.state[name], paths: [], pathConflict: false
  }
  if (!def || !def.needs || !def.needs.length) return out
  const paths = engine.normalizeNeeds(def.needs)

  let anyOk = false
  let anyPending = false
  let allBlocked = true

  paths.forEach((p, pi) => {
    const conds = p.map(cond => {
      const [ref, want] = engine.splitRef(cond)
      const res = engine.evalCond(cond)
      const target = registry[ref]
      return {
        ref, want,
        state: engine.state[ref] || 'unknown',
        ok: res === true,
        unknown: res === 'unknown',
        title: target ? target.title : ref,
        kind: target ? target.kind : null
      }
    })
    const done = conds.every(c => c.ok)
    const blocked = conds.some(c => !c.ok && !c.unknown)
    if (done) anyOk = true
    if (!done && !blocked) anyPending = true
    if (!blocked) allBlocked = false
    out.paths.push({ index: pi, conds, status: done ? 'ok' : (blocked ? 'blocked' : 'pending') })
  })

  out.strictOr = allBlocked ? 'no' : (anyOk ? 'yes' : 'unknown')
  out.engineSays = engine.state[name]
  if (out.engineSays === 'no' && !allBlocked && (anyPending || anyOk)) out.pathConflict = true
  return out
}

function reverseTree(name, opts) {
  const options = opts || {}
  const maxDepth = options.maxDepth || 10
  const { registry } = freshRegistry()
  if (!registry[name]) return { ok: false, error: '节点不存在: ' + name }

  function build(n, depth, pol) {
    const def = registry[n]
    if (!def) return { name: n, title: n + '（不存在）', missing: true, pol, paths: [], children: [] }
    const leaf = !def.needs || !def.needs.length
    const node = {
      name: n, title: def.title, kind: def.kind, pol, leaf,
      ask: def.ask || null,
      hasTrigger: typeof def.trigger === 'function',
      trigger: def.trigger ? (P.keywordArrayFromValue(String(def.trigger)) || null) : null,
      contraindications: def.contraindications || [],
      paths: [],
      truncated: false
    }
    if (leaf) return node
    if (depth >= maxDepth) { node.truncated = true; return node }
    const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
    node.paths = paths.map((p, pi) => ({
      index: pi,
      conds: p.map(c => {
        const s = String(c)
        const childPol = s.endsWith('.no') ? 'no' : 'yes'
        const ref = s.replace(/\.(yes|no)$/, '')
        return { ref, pol: childPol, node: build(ref, depth + 1, childPol) }
      })
    }))
    return node
  }

  const root = build(name, 0, 'yes')

  const dependents = []
  for (const n of Object.keys(registry)) {
    const def = registry[n]
    if (!def.needs || !def.needs.length) continue
    const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
    paths.forEach((p, pi) => p.forEach(c => {
      if (String(c).replace(/\.(yes|no)$/, '') === name) {
        dependents.push({ name: n, title: def.title, kind: def.kind, pol: String(c).endsWith('.no') ? 'no' : 'yes', path: pi })
      }
    }))
  }
  return { ok: true, root, dependents }
}

/**
 * 问诊回放（真实 Asker）
 * { truth: {name:'yes'|'no'}, dontKnow: [name], initialAssignments: {}, maxSteps }
 */
function walkthrough(input) {
  const o = input || {}
  const { registry } = freshRegistry()
  const engine = new Engine(registry)
  const asker = new Asker(engine)
  const truth = o.truth || {}
  const dontKnow = new Set(o.dontKnow || [])
  const steps = []

  applyAssignments(engine, o.initialAssignments || {})

  for (let i = 0; i < (o.maxSteps || 30); i++) {
    const q = asker.nextQuestion()
    const cands = asker.candidates()
    if (!q) {
      steps.push({
        index: i + 1, type: 'end', candidates: cands.length,
        reason: cands.length === 0 ? '已无候选方剂（条件都被否掉）'
          : '已无更多可区分的症状（多解，剩下 ' + cands.length + ' 个候选）'
      })
      break
    }
    let answer
    if (dontKnow.has(q.leaf)) answer = 'unknown'
    else if (truth[q.leaf] === 'yes' || truth[q.leaf] === 'no') answer = truth[q.leaf]
    else answer = 'unknown'

    if (answer === 'unknown') asker.markAsked(q.leaf)
    else engine.setDirect(q.leaf, answer)

    const after = asker.candidates()
    steps.push({
      index: i + 1, type: 'ask',
      leaf: q.leaf, title: q.title, phrase: q.phrase,
      discrimination: q.count,
      candidatesBefore: cands.length,
      answer,
      candidatesAfter: after.length,
      answerSource: dontKnow.has(q.leaf) ? '答「不知道」' : (truth[q.leaf] ? '按病人真实情况' : '病人未提及 → 不知道')
    })

    if (after.length <= 1) {
      steps.push({
        index: i + 2, type: 'end', candidates: after.length,
        reason: after.length === 1
          ? '候选收敛到唯一方剂：' + registry[after[0]].title
          : '候选已清空（没有方剂成立）'
      })
      break
    }
  }

  const finalStates = {}
  for (const n of Object.keys(registry)) if (engine.state[n] !== 'unknown') finalStates[n] = engine.state[n]

  return {
    steps,
    finalStates,
    candidates: asker.candidates().map(n => ({ name: n, title: registry[n].title })),
    yesFormulas: Object.entries(engine.state)
      .filter(([n, s]) => s === 'yes' && registry[n] && registry[n].kind === 'formula')
      .map(([n]) => ({ name: n, title: registry[n].title })),
    yesSummaries: Object.entries(engine.state)
      .filter(([n, s]) => s === 'yes' && registry[n] && registry[n].kind === 'summary')
      .map(([n]) => ({ name: n, title: registry[n].title })),
    contraindications: engine.contraindications()
  }
}

module.exports = {
  ROOT, PLUGINS, LAYOUT_FILE, BACKUP_DIR,
  buildGraph, readLayout, saveLayout, readSource,
  computePlan, verifyPlan, previewSave, applySave,
  simulate, explainNode, reverseTree, walkthrough,
  freshRegistry, lineDiff, sha256
}
