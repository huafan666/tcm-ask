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
      note: rec.note || ''
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

module.exports = { FILE, load, emptyOf, ofNode, ofEdge, attachTo, setContributors }
