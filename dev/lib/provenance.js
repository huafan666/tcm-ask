'use strict'
// dev/lib/provenance.js
// ============================================================
// 条文来源（provenance）：记录「这个节点/这条依赖关系是谁提供的」
//
// 插件文件本身不放归属字段（避免污染 8 字段模型、也不让保存流程操心），
// 而是放在同目录的 plugins/provenance.json（随仓库版本化）：
//
//   {
//     "version": 1,
//     "sources": { "shanghanlun": { "label": "伤寒论原方", "title": "伤寒论", … } },
//     "nodes":   { "mahuang_tang": { "source": "shanghanlun", "refs": ["35"], "by": "system" } },
//     "edges":   { "mahuang_tang|no_sweat.yes": { "source": "shanghanlun", "refs": ["35"] } }
//   }
//
// 平台侧的人类贡献者仍然走数据库（attributions 表），这里只负责「经典原文出处」。
// 文件不存在时一切按「未标注」处理，不影响开发端启动。
// ============================================================

const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', '..', 'plugins', 'provenance.json')

function readRaw() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch (_) {
    return { version: 1, sources: {}, nodes: {}, edges: {} }
  }
}

function emptyOf() {
  return { version: 1, sources: {}, nodes: {}, edges: {} }
}

/** 给前端用的完整视图：把 source 展开成可读文字 */
function load() {
  const raw = readRaw()
  const sources = raw.sources || {}
  const expand = rec => {
    if (!rec) return null
    const s = sources[rec.source] || {}
    return {
      sourceId: rec.source || null,
      label: rec.label || s.label || s.title || rec.source || '未标注',
      title: s.title || '',
      author: s.author || '',
      dynasty: s.dynasty || '',
      refs: Array.isArray(rec.refs) ? rec.refs : (rec.ref ? [String(rec.ref)] : []),
      by: rec.by || '',
      byAt: rec.byAt || '',
      note: rec.note || '',
      noteBy: rec.noteBy || '',
      noteAt: rec.noteAt || ''
    }
  }
  const nodes = {}
  for (const [name, rec] of Object.entries(raw.nodes || {})) nodes[name] = expand(rec)
  const edges = {}
  for (const [key, rec] of Object.entries(raw.edges || {})) edges[key] = expand(rec)
  return {
    file: FILE,
    version: raw.version || 1,
    sources,
    nodes,
    edges,
    counts: { nodes: Object.keys(nodes).length, edges: Object.keys(edges).length }
  }
}

/** 某个节点 / 某条条件（owner|ref.pol）的出处 */
function ofNode(name, view) {
  const v = view || load()
  return v.nodes[name] || null
}

function ofEdge(owner, ref, pol, view) {
  const v = view || load()
  return v.edges[owner + '|' + ref + '.' + (pol || 'yes')] || null
}

/** 给 graph.buildGraph 用的精简视图（避免每个节点都读一次文件） */
function attachTo(nodes, view) {
  const v = view || load()
  return nodes.map(n => Object.assign(n, { provenance: v.nodes[n.name] || null }))
}

/**
 * 节点改名时迁移出处与备注：nodes 的键、edges 里 owner / ref 都要跟着改。
 * 不迁移就会出现「备注留在旧名字下、新名字一片空白」这种鬼问题。
 */
function renameNodeInProvenance(from, to, filePath) {
  const target = filePath || FILE
  let data
  try { data = JSON.parse(fs.readFileSync(target, 'utf8')) } catch (_) { return { changed: false } }
  let changed = false
  data.nodes = data.nodes || {}
  if (data.nodes[from] && from !== to) {
    data.nodes[to] = data.nodes[from]
    delete data.nodes[from]
    changed = true
  }
  data.edges = data.edges || {}
  const next = {}
  for (const [key, rec] of Object.entries(data.edges)) {
    const i = key.indexOf('|')
    const owner = i >= 0 ? key.slice(0, i) : key
    const tail = i >= 0 ? key.slice(i + 1) : ''
    const dot = tail.lastIndexOf('.')
    const ref = dot >= 0 ? tail.slice(0, dot) : tail
    const pol = dot >= 0 ? tail.slice(dot + 1) : 'yes'
    const nOwner = owner === from ? to : owner
    const nRef = ref === from ? to : ref
    if (nOwner !== owner || nRef !== ref) changed = true
    next[nOwner + '|' + nRef + '.' + pol] = rec
  }
  data.edges = next
  if (changed) {
    data.generatedAt = new Date().toISOString()
    fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
  }
  return { changed }
}

/**
 * 记录「谁录入的」——平台审核通过时调用。
 * entries: [{ name, by, note? }]，by 是医生的显示名（不要带 system: 前缀）
 *
 * 规则：
 *   · 节点已有出处（伤寒论/金匮要略…）→ 只补/更新 by，不动 source 与 refs
 *   · 节点还没有出处（医生自己新建的）→ 建一条 source:'manual'、label:'人工录入'
 */
function setContributors(entries, filePath) {
  const target = filePath || FILE
  let raw
  try { raw = JSON.parse(fs.readFileSync(target, 'utf8')) } catch (_) { raw = null }
  const data = raw || { version: 1, generatedAt: new Date().toISOString(), sources: {}, nodes: {}, edges: {} }
  data.sources = data.sources || {}
  data.nodes = data.nodes || {}
  data.sources.manual = data.sources.manual || {
    label: '人工录入',
    title: '医生录入',
    author: '',
    dynasty: '',
    note: '非原典条文，由认证医生在画布上录入、管理员审核通过'
  }

  const stamp = new Date().toISOString().slice(0, 10)
  let changed = 0
  for (const e of entries || []) {
    if (!e || !e.name || !e.by) continue
    const cur = data.nodes[e.name]
    if (cur) {
      if (cur.by === e.by) continue
      cur.by = e.by
      cur.byAt = stamp
      if (e.note) cur.note = e.note
    } else {
      data.nodes[e.name] = { source: 'manual', label: '人工录入', refs: [], by: e.by, byAt: stamp }
      if (e.note) data.nodes[e.name].note = e.note
    }
    changed++
  }
  if (!changed) return { changed: 0, file: target }
  data.generatedAt = new Date().toISOString()
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return { changed, file: target }
}

/**
 * 自由说明：让后来编辑的人知道「这条别人也遇到过、可以这样引用」。
 * 与系统生成的 note 共用一个字段，但会记下是谁写的、什么时候。
 */
function setNote(name, note, by, filePath) {
  const target = filePath || FILE
  let data
  try { data = JSON.parse(fs.readFileSync(target, 'utf8')) } catch (_) { data = null }
  if (!data) data = { version: 1, generatedAt: new Date().toISOString(), sources: {}, nodes: {}, edges: {} }
  data.nodes = data.nodes || {}
  const cur = data.nodes[name] || { source: 'manual', label: '人工录入', refs: [] }
  const text = String(note || '').trim()
  if (!text) {
    delete cur.note
    delete cur.noteBy
    delete cur.noteAt
  } else {
    cur.note = text.slice(0, 500)
    cur.noteBy = by || ''
    cur.noteAt = new Date().toISOString().slice(0, 10)
  }
  data.nodes[name] = cur
  data.generatedAt = new Date().toISOString()
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return cur
}

/** 关系级说明：key = 'owner|ref.pol'，让「这条链条别人也见过」能留下话 */
function setEdgeNote(owner, ref, pol, note, by, filePath) {
  const target = filePath || FILE
  let data
  try { data = JSON.parse(fs.readFileSync(target, 'utf8')) } catch (_) { data = null }
  if (!data) data = { version: 1, generatedAt: new Date().toISOString(), sources: {}, nodes: {}, edges: {} }
  data.edges = data.edges || {}
  const key = owner + '|' + ref + '.' + (pol || 'yes')
  const cur = data.edges[key] || {}
  const text = String(note || '').trim()
  if (!text) { delete data.edges[key] } else {
    cur.note = text.slice(0, 500)
    cur.noteBy = by || ''
    cur.noteAt = new Date().toISOString().slice(0, 10)
    data.edges[key] = cur
  }
  data.generatedAt = new Date().toISOString()
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data.edges[key] || null
}

module.exports = { FILE, load, emptyOf, ofNode, ofEdge, attachTo, setContributors, setNote, setEdgeNote, renameNodeInProvenance }
