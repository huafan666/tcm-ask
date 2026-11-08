'use strict'
// platform/review.js
// ============================================================
// 医生「提交条文」→ 管理员审核 → 落盘 + 字段级归属登记
//
// 关键点：医生不直接改 plugins/*.js。画布保存时提交的是一份 payload
// （和 dev 端 /api/save 完全同构），先入库为 draft，管理员看过逐行 diff
// 之后再调用 dev/lib/graph.js 的 applySave 真正写盘（带备份 + 编译复核）。
// ============================================================

const graph = require('../dev/lib/graph')
const provenance = require('../dev/lib/provenance')
const P = require('../dev/lib/parse')
const { q, now } = require('./db')
const { HttpError } = require('./auth')

const FIELDS = ['title', 'trigger', 'negate', 'ask', 'needs', 'contraindications']
const FIELD_LABEL = {
  node: '节点本身',
  title: '中文名',
  trigger: '口语触发词',
  negate: '否定词',
  ask: '反问话术',
  needs: '依赖条件',
  contraindications: '禁忌/注意事项'
}

/** 一份 payload 里「动了哪些节点、哪些字段」——用于草稿摘要与归属登记 */
function touchedItems(payload) {
  const items = []
  const seen = new Set()
  const push = (name, field) => {
    const key = name + '::' + field
    if (seen.has(key)) return
    seen.add(key)
    items.push({ name, field })
  }
  for (const c of payload.created || []) {
    if (!c || !c.name) continue
    push(c.name, 'node')
    for (const f of FIELDS) if (f in c) push(c.name, f)
  }
  for (const u of payload.updated || []) {
    if (!u || !u.name) continue
    for (const f of FIELDS) if (f in u) push(u.name, f)
  }
  for (const d of payload.deleted || []) {
    const name = typeof d === 'string' ? d : d && d.name
    if (name) push(name, 'node')
  }
  for (const r of payload.renamed || []) {
    if (r && r.from && r.to && r.from !== r.to) { push(r.from, 'node'); push(r.to, 'node') }
  }
  return items
}

function summarize(payload, plan) {
  const items = touchedItems(payload)
  const nodes = [...new Set(items.map(i => i.name))]
  const files = (plan && plan.files) || []
  return {
    nodeCount: nodes.length,
    nodes: nodes.slice(0, 12),
    fieldCount: items.length,
    fileCount: files.length,
    changedLines: files.reduce((n, f) => n + (f.changedLines || 0), 0),
    summary: nodes.length
      ? `${nodes.length} 个节点 · ${files.length} 个文件 · ${files.reduce((n, f) => n + (f.changedLines || 0), 0)} 行改动`
      : '没有任何改动'
  }
}

function draftTitle(payload) {
  const nodes = [...new Set(touchedItems(payload).map(i => i.name))]
  if (!nodes.length) return '空提交'
  return nodes.length <= 3 ? nodes.join('、') : `${nodes.slice(0, 3).join('、')} 等 ${nodes.length} 个节点`
}

/** 医生提交草稿（写库，不动磁盘） */
function submitDraft(user, payload) {
  if (!payload || typeof payload !== 'object') throw new HttpError(400, '缺少提交内容')
  const items = touchedItems(payload)
  if (!items.length) throw new HttpError(400, '这次没有任何改动，无需提交审核')

  const plan = graph.previewSave(payload)      // 只做校验 + 生成 diff，不写盘
  if (!plan.ok) {
    return { ok: false, errors: plan.errors || ['提交内容没通过校验'], notes: plan.notes || [] }
  }
  const meta = summarize(payload, plan)
  const res = q.run(
    `INSERT INTO drafts (author_id, title, summary, payload, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    user.id, draftTitle(payload), meta.summary, JSON.stringify(payload), now()
  )
  return {
    ok: true,
    id: Number(res.lastInsertRowid),
    meta,
    notes: ['已提交审核，管理员通过后才会写入条文库']
  }
}

function draftRows(where, params) {
  return q.all(
    `SELECT d.*, u.display_name AS author_name, u.username AS author_username, u.verified AS author_verified,
            r.display_name AS reviewer_name
       FROM drafts d
       JOIN users u ON u.id = d.author_id
       LEFT JOIN users r ON r.id = d.reviewer_id
       ${where ? 'WHERE ' + where : ''}
       ORDER BY d.id DESC`,
    ...(params || [])
  )
}

function toDraftDto(row, opts = {}) {
  const out = {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    author: { id: row.author_id, displayName: row.author_name, username: row.author_username, verified: !!row.author_verified },
    reviewer: row.reviewer_name ? { displayName: row.reviewer_name } : null,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  }
  if (opts.withItems) {
    const payload = JSON.parse(row.payload)
    out.items = touchedItems(payload).map(i => ({ name: i.name, field: i.field, fieldLabel: FIELD_LABEL[i.field] || i.field }))
  }
  return out
}

function listDrafts({ status, authorId } = {}) {
  const where = []
  const params = []
  if (status) { where.push('d.status = ?'); params.push(status) }
  if (authorId) { where.push('d.author_id = ?'); params.push(authorId) }
  return draftRows(where.join(' AND '), params).map(r => toDraftDto(r))
}

/** 草稿详情：重新算一遍 diff（这样管理员看到的是「现在落盘会发生什么」） */
function getDraft(id, user) {
  const row = q.get(
    `SELECT d.*, u.display_name AS author_name, u.username AS author_username, u.verified AS author_verified,
            r.display_name AS reviewer_name
       FROM drafts d JOIN users u ON u.id = d.author_id LEFT JOIN users r ON r.id = d.reviewer_id
      WHERE d.id = ?`, Number(id))
  if (!row) throw new HttpError(404, '草稿不存在')
  if (user.role !== 'admin' && row.author_id !== user.id) throw new HttpError(403, '只能查看自己提交的草稿')

  const payload = JSON.parse(row.payload)
  const plan = graph.previewSave(payload)
  const dto = toDraftDto(row, { withItems: true })
  dto.files = (plan.files || []).map(f => ({
    relPath: f.relPath, kind: f.kind, node: f.node, changedLines: f.changedLines,
    diff: f.diff, notes: f.notes
  }))
  dto.errors = plan.errors || []
  dto.notes = plan.notes || []
  dto.ok = plan.ok
  dto.canApprove = row.status === 'pending' && plan.ok && user.role === 'admin'
  dto.payloadPreview = {
    created: (payload.created || []).length,
    updated: (payload.updated || []).length,
    deleted: (payload.deleted || []).length,
    renamed: (payload.renamed || []).length
  }
  return dto
}

/** 把一份载荷里的 needs 变化 diff 成「边」的增删：这套系统只有节点和关系，关系不能是黑盒 */
function diffEdges(payload) {
  const sig = paths => {
    const s = new Set()
    for (const p of (paths || [])) for (const c of p) s.add((c && c.ref ? c.ref : String(c).split('.')[0]) + '.' +
      (c && c.pol ? c.pol : (String(c).endsWith('.no') ? 'no' : 'yes')))
    return s
  }
  const readNeeds = name => {
    try {
      const src = graph.readSource(name)
      if (!src || !src.ok) return []
      const m = P.scanPluginSource(src.source)
      return m.ok ? m.model.needs : []
    } catch (_) { return [] }
  }
  const rows = []
  const push = (owner, cond, action) => {
    const i = cond.lastIndexOf('.')
    rows.push({ owner, ref: cond.slice(0, i), pol: cond.slice(i + 1), action })
  }
  for (const u of payload.updated || []) {
    if (!u || !u.name || !('needs' in u)) continue
    const before = sig(readNeeds(u.name))
    const after = sig(u.needs)
    for (const c of after) if (!before.has(c)) push(u.name, c, 'add')
    for (const c of before) if (!after.has(c)) push(u.name, c, 'remove')
  }
  for (const c of payload.created || []) {
    if (!c || !c.name) continue
    for (const cond of sig(c.needs)) push(c.name, cond, 'add')
  }
  for (const d of payload.deleted || []) {
    const name = typeof d === 'string' ? d : d && d.name
    if (!name) continue
    for (const cond of sig(readNeeds(name))) push(name, cond, 'remove')
  }
  return rows
}

/** 审核通过：真正写盘 + 登记字段级归属 */

function approveDraft(id, reviewer, note) {
  const row = q.get('SELECT * FROM drafts WHERE id = ?', Number(id))
  if (!row) throw new HttpError(404, '草稿不存在')
  if (row.status !== 'pending') throw new HttpError(409, `该草稿已经是「${row.status}」状态`)
  const payload = JSON.parse(row.payload)

  const edgeRows = diffEdges(payload)      // 落盘前先算出关系增删
  const result = graph.applySave(payload)     // 带备份 + 落盘后编译复核
  if (!result.ok) {
    return { ok: false, errors: result.errors || ['落盘失败'], written: result.written || [] }
  }

  const stamp = now()
  const items = touchedItems(payload)
  for (const it of items) {
    q.run(
      'INSERT INTO attributions (node_name, field, author_id, draft_id, created_at) VALUES (?, ?, ?, ?, ?)',
      it.name, it.field, row.author_id, row.id, stamp
    )
  }

  // 同步「谁录入的」到文件侧 provenance.json —— 这样开发端（standalone）也能看到录入人，
  // 而不只是平台数据库里能查。已有出处的节点只补 by，不覆盖 source/refs。
  let provenanceResult = null
  try {
    const author = q.get('SELECT display_name FROM users WHERE id = ?', row.author_id)
    const names = [...new Set(items.filter(i => i.field !== 'node' || true).map(i => i.name))]
    if (author && names.length) {
      provenanceResult = provenance.setContributors(names.map(name => ({ name, by: author.display_name })))
    }
  } catch (e) {
    provenanceResult = { error: e.message }
  }
  // 关系级留痕：每条边的增删都记下是谁、哪份草稿
  for (const e of edgeRows) {
    q.run('INSERT INTO edge_changes (draft_id, owner, ref, pol, action, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      row.id, e.owner, e.ref, e.pol, e.action, row.author_id, stamp)
  }

  q.run(
    `UPDATE drafts SET status = 'approved', reviewer_id = ?, review_note = ?, reviewed_at = ? WHERE id = ?`,
    reviewer.id, String(note || ''), stamp, row.id
  )
  return {
    ok: true,
    written: result.written,
    backups: result.backups,
    backupDir: result.backupDir,
    verify: result.verify,
    attributionCount: items.length,
    provenance: provenanceResult
  }
}

function rejectDraft(id, reviewer, note) {
  const row = q.get('SELECT * FROM drafts WHERE id = ?', Number(id))
  if (!row) throw new HttpError(404, '草稿不存在')
  if (row.status !== 'pending') throw new HttpError(409, `该草稿已经是「${row.status}」状态`)
  if (!String(note || '').trim()) throw new HttpError(400, '驳回请写明原因，方便医生修改')
  q.run(`UPDATE drafts SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = ? WHERE id = ?`,
    reviewer.id, String(note).trim(), now(), row.id)
  return { ok: true }
}

function pendingCount() {
  const r = q.get("SELECT COUNT(*) AS n FROM drafts WHERE status = 'pending'")
  return r ? r.n : 0
}

// ---------- 归属查询 ----------

/** 某个节点每个字段最近一次的提供者 */
function attributionOf(nodeName) {
  const rows = q.all(
    `SELECT a.field, a.created_at, u.id AS author_id, u.display_name, u.role, u.verified
       FROM attributions a JOIN users u ON u.id = a.author_id
      WHERE a.node_name = ?
      ORDER BY a.id DESC`, String(nodeName))
  const byField = {}
  for (const r of rows) {
    if (byField[r.field]) continue
    byField[r.field] = {
      field: r.field,
      fieldLabel: FIELD_LABEL[r.field] || r.field,
      author: { id: r.author_id, displayName: r.display_name, role: r.role, verified: !!r.verified },
      at: r.created_at
    }
  }
  return Object.values(byField)
}

/** 全部归属（画布注入脚本一次取走，避免逐节点请求） */
function attributionMap() {
  const rows = q.all(
    `SELECT a.node_name, a.field, a.created_at, u.id AS author_id, u.display_name, u.role, u.verified
       FROM attributions a JOIN users u ON u.id = a.author_id
      ORDER BY a.id DESC`)
  const map = {}
  for (const r of rows) {
    const node = (map[r.node_name] = map[r.node_name] || {})
    if (node[r.field]) continue
    node[r.field] = {
      fieldLabel: FIELD_LABEL[r.field] || r.field,
      displayName: r.display_name,
      role: r.role,
      verified: !!r.verified,
      at: r.created_at
    }
  }
  return map
}

/** 贡献榜：谁提供了多少条文的多少个字段 */
function contributors() {
  return q.all(
    `SELECT u.id, u.display_name, u.role, u.verified, u.specialty,
            COUNT(DISTINCT a.node_name) AS nodes,
            COUNT(*) AS fields,
            MAX(a.created_at) AS last_at
       FROM attributions a JOIN users u ON u.id = a.author_id
      GROUP BY u.id
      ORDER BY fields DESC, nodes DESC`)
}

/** 某个节点当前所有关系（边）的「谁加的」——取每条边最近一次 add 的记录 */
function edgesOf(nodeName) {
  const rows = q.all(
    `SELECT e.owner, e.ref, e.pol, e.action, e.created_at, u.display_name, u.verified, e.draft_id
       FROM edge_changes e JOIN users u ON u.id = e.author_id
      WHERE e.owner = ? OR e.ref = ?
      ORDER BY e.id DESC`, String(nodeName), String(nodeName))
  const latest = new Map()
  for (const r of rows) {
    const key = r.owner + '|' + r.ref + '.' + r.pol
    if (latest.has(key)) continue
    latest.set(key, {
      owner: r.owner, ref: r.ref, pol: r.pol, action: r.action,
      draftId: r.draft_id, at: r.created_at,
      author: { displayName: r.display_name, verified: !!r.verified },
      note: (provenance.ofEdge(r.owner, r.ref, r.pol) || {}).note || ''
    })
  }
  return [...latest.values()]
}

/** 备注变更日志：一次保存 = 一条日志 */
function recordNoteChange({ nodeName, scope, owner, ref, pol, note, authorId }) {
  q.run(
    'INSERT INTO note_changes (node_name, scope, owner, ref, pol, note, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    String(nodeName), String(scope || 'node'), owner || null, ref || null, pol || null, String(note || ''), authorId, now())
}

/** 完整溯源 + 日志：出处、时间线（草稿/备注/关系 三条来源合并后按时间倒序） */
function historyFor(nodeName) {
  const name = String(nodeName)
  const attrs = q.all(
    `SELECT a.field, d.id AS draft_id, d.title, d.status, d.review_note,
            d.created_at AS submitted_at, d.reviewed_at,
            au.display_name AS author, au.verified AS author_verified,
            rv.display_name AS reviewer
       FROM attributions a
       JOIN drafts d ON d.id = a.draft_id
       JOIN users au ON au.id = a.author_id
       LEFT JOIN users rv ON rv.id = d.reviewer_id
      WHERE a.node_name = ?
      ORDER BY a.id DESC`, name)

  const byDraft = new Map()
  for (const row of attrs) {
    if (!byDraft.has(row.draft_id)) {
      byDraft.set(row.draft_id, {
        draftId: row.draft_id, title: row.title, status: row.status,
        author: { displayName: row.author, verified: !!row.author_verified },
        reviewer: row.reviewer || null, reviewNote: row.review_note || '',
        submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, fields: []
      })
    }
    const g = byDraft.get(row.draft_id)
    const label = FIELD_LABEL[row.field] || row.field
    if (!g.fields.includes(label)) g.fields.push(label)
  }
  const timeline = [...byDraft.values()]

  const notes = q.all(
    `SELECT n.*, u.display_name FROM note_changes n JOIN users u ON u.id = n.author_id
      WHERE n.node_name = ? ORDER BY n.id DESC`, name)

  // 合并成一条日志流（按时间倒序；草稿用审核时间，没审核就用提交时间）
  const log = []
  for (const t of timeline) {
    log.push({
      at: t.reviewedAt || t.submittedAt,
      type: 'draft',
      label: '条文修改',
      text: '草稿 #' + t.draftId + ' · ' + t.status + ' · 改了：' + (t.fields.join('、') || '—'),
      author: t.author.displayName,
      verified: t.author.verified,
      extra: [t.reviewer ? '审核 ' + t.reviewer : '', t.reviewNote || ''].filter(Boolean).join(' · ')
    })
  }
  for (const n of notes) {
    log.push({
      at: n.created_at,
      type: 'note',
      label: n.scope === 'edge' ? '关系备注' : '备注',
      text: n.note ? n.note : '（清空备注）',
      author: n.display_name,
      verified: false,
      extra: n.scope === 'edge' ? (n.owner + ' → ' + n.ref + '.' + n.pol) : ''
    })
  }
  for (const e of edgesOf(name)) {
    log.push({
      at: e.at,
      type: 'edge',
      label: e.action === 'add' ? '新增关系' : '删除关系',
      text: e.owner + ' → ' + e.ref + '.' + e.pol,
      author: e.author.displayName,
      verified: e.author.verified,
      extra: '草稿 #' + e.draftId
    })
  }
  log.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))

  return {
    node: name,
    provenance: provenance.ofNode(name),
    notes: notes.map(n => ({ note: n.note, scope: n.scope, author: n.display_name, at: n.created_at })),
    timeline,
    edges: edgesOf(name),
    log
  }
}

module.exports = {
  FIELD_LABEL,
  touchedItems,
  diffEdges,
  submitDraft,
  listDrafts,
  getDraft,
  approveDraft,
  rejectDraft,
  pendingCount,
  attributionOf,
  attributionMap,
  contributors,
  edgesOf,
  historyFor,
  recordNoteChange
}
