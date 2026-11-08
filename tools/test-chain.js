'use strict'
// 验证：走完一次真实问诊 → 取「触发链条」→ 看是否带出处与录入人
const BASE = 'http://127.0.0.1:3095'
let cookie = ''
async function req(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {})
  if (cookie) headers.Cookie = cookie
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET', headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  })
  for (const c of (res.headers.getSetCookie ? res.headers.getSetCookie() : [])) {
    const kv = c.split(';')[0]
    if (kv.startsWith('tcm_token=')) cookie = kv
  }
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } } catch (_) { return { status: res.status, data: { raw: text.slice(0, 200) } } }
}

;(async () => {
  await req('/api/auth/login', { method: 'POST', body: { username: 'patient', password: 'patient123' } })
  const n = await req('/api/new')
  const sid = n.data.id
  console.log('会话:', sid, '| 首问:', n.data.question && n.data.question.phrase)

  const feed = ['冬天受凉，发烧，没有汗，特别怕冷，脖子发硬，后背僵得往后弓，牙关咬紧张不开嘴']
  for (let i = 0; i < 60; i++) feed.push('否')
  let last = null
  for (const text of feed) {
    last = await req('/api/input', { method: 'POST', body: { sid, text } })
    if (last.data.result) break
  }
  const r = last.data.result
  console.log('\n结论:', r ? (r.formulas || []).map(f => f.title).join(' / ') || '（未收敛到方剂）' : '（没收敛）')

  const c = await req('/api/consult/chain?sid=' + sid)
  if (c.status !== 200) { console.log('链条接口失败:', c.status, c.data); return }
  const chain = c.data.chain
  console.log('链条来源:', c.data.from, '| 命中节点数:', chain.targets.length)

  for (const t of chain.targets.slice(0, 4)) {
    console.log(`\n【${t.title}】${t.kind} ← 三元组 ${t.pathIndex + 1}/${t.pathTotal}`)
    for (const cond of t.path) {
      const node = chain.nodes[cond.name] || {}
      const p = node.provenance
      const src = p ? `${p.label}${p.refs && p.refs.length ? ' · ' + String(p.refs[0]).slice(0, 30) : ''}` : '未标注来源'
      const who = p && p.by && !String(p.by).startsWith('system:') ? ` · 录入 ${p.by}` : ''
      const contrib = (node.contributors || []).filter(x => x.field !== 'node').slice(0, 2)
        .map(x => `${x.fieldLabel}:${x.displayName}`).join(',')
      console.log(`   ${cond.satisfied ? '✓' : (cond.state === 'no' ? '✗' : '?')} ${cond.title}  [${cond.state}]  ${src}${who}${contrib ? '  (' + contrib + ')' : ''}`)
    }
  }
})()
