'use strict'
// 平台端到端自测：注册/登录 → 问诊 → 医生提交 → 管理员审核落盘 → 归属 → 社区
const BASE = 'http://127.0.0.1:3095'

function jar() {
  let cookie = ''
  return {
    async req(path, opts = {}) {
      const headers = Object.assign({}, opts.headers || {})
      if (cookie) headers.Cookie = cookie
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
      const res = await fetch(BASE + path, {
        method: opts.method || 'GET',
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        redirect: 'manual'
      })
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : []
      for (const c of sc) {
        const kv = c.split(';')[0]
        if (kv.startsWith('tcm_token=')) cookie = kv
      }
      const text = await res.text()
      let data
      try { data = text ? JSON.parse(text) : {} } catch (_) { data = { _raw: text.slice(0, 200) } }
      return { status: res.status, data, text, headers: res.headers }
    }
  }
}

let pass = 0, fail = 0
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name) }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')) }
}

const anon = jar()
const patient = jar()
const doctor = jar()
const admin = jar()

console.log('\n[1] 账号与会话')
{
  const r = await anon.req('/api/auth/me')
  ok('匿名 me 返回 user=null', r.data.user === null, r.data)
  ok('me 带条文统计', r.data.stats && r.data.stats.total > 200, r.data.stats)

  const bad = await anon.req('/api/auth/login', { method: 'POST', body: { username: 'patient', password: 'wrong' } })
  ok('错误密码被拒 401', bad.status === 401, bad.data)

  const p = await patient.req('/api/auth/login', { method: 'POST', body: { username: 'patient', password: 'patient123' } })
  ok('患者登录成功', p.status === 200 && p.data.user.role === 'patient', p.data)

  const d = await doctor.req('/api/auth/login', { method: 'POST', body: { username: 'doctor', password: 'doctor123' } })
  ok('医生登录成功且已认证', d.status === 200 && d.data.user.verified === true, d.data)

  const a = await admin.req('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin123' } })
  ok('管理员登录成功', a.status === 200 && a.data.user.role === 'admin', a.data)

  const reg = await anon.req('/api/auth/register', { method: 'POST', body: { username: 'newdoc_' + Date.now().toString(36), password: 'abc123', displayName: '新医生', role: 'doctor' } })
  ok('医生自助注册后处于待开通', reg.status === 200 && reg.data.needsApproval === true, reg.data)

  const regAdmin = await anon.req('/api/auth/register', { method: 'POST', body: { username: 'hackadmin', password: 'abc123', role: 'admin' } })
  ok('禁止自助注册管理员', regAdmin.status === 403, regAdmin.data)
}

console.log('\n[2] 患者问诊（复用原引擎）')
let sid = ''
{
  const n = await patient.req('/api/new')
  ok('新建会话返回首问', !!(n.data.id && n.data.question && n.data.question.phrase), n.data)
  ok('首问是「是不是」开头', /^是不是/.test(n.data.question.phrase || ''), n.data.question)
  sid = n.data.id

  let last = null
  const feed = ['我怕冷，没有汗，后脖子发僵']
  for (let i = 0; i < 220; i++) feed.push('否')
  for (const text of feed) {
    last = await patient.req('/api/input', { method: 'POST', body: { sid, text } })
    if (last.data.result) break
  }
  ok('问诊能收敛出结论', !!(last.data.result && last.data.result.explanation), last.data && Object.keys(last.data))

  // 结论后要能拿到「触发链条」，且每个节点带出处与录入人
  const ch = await patient.req('/api/consult/chain?sid=' + sid)
  ok('结论后能取到触发链条', ch.status === 200 && ch.data.chain && Array.isArray(ch.data.chain.targets), ch.data)
  if (ch.status === 200) {
    const t0 = ch.data.chain.targets[0]
    ok('链条带命中的三元组条件', !!t0 && Array.isArray(t0.path) && t0.path.length > 0, t0)
    ok('链条条件都是满足状态', !!t0 && t0.path.every(c => c.satisfied === true), t0 && t0.path.map(c => c.state))
    const someNode = Object.values(ch.data.chain.nodes || {})[0]
    ok('链条节点带出处（书/条）', !!someNode && !!someNode.provenance && !!someNode.provenance.label, someNode)
    ok('链条节点带录入人字段', !!someNode && 'by' in someNode.provenance, someNode && someNode.provenance)
  }

  const h = await patient.req('/api/consult/history')
  ok('结论已存档到我的记录', h.data.items.length >= 1, h.data)
  ok('存档里有辨证倾向摘要', !!h.data.items[0].summary, h.data.items[0])

  const anonSession = await anon.req('/api/input', { method: 'POST', body: { sid: 'nope', text: 'x' } })
  ok('不存在的会话返回 404', anonSession.status === 404, anonSession.data)
}

console.log('\n[3] 条文画布权限')
{
  const anonGraph = await anon.req('/api/graph')
  ok('匿名不能读条文图（401）', anonGraph.status === 401, anonGraph.data)

  const patGraph = await patient.req('/api/graph')
  ok('患者不能读条文图（403）', patGraph.status === 403, patGraph.data)

  const docGraph = await doctor.req('/api/graph')
  ok('医生能读条文图', docGraph.status === 200 && docGraph.data.nodes.length > 200, docGraph.data && docGraph.data.stats)

  const canvasAnon = await anon.req('/canvas/')
  ok('/canvas/ 未登录跳登录页', canvasAnon.status === 302 && /\/login/.test(canvasAnon.headers.get('location') || ''), canvasAnon.status)

  // 画布页面用 ./style.css、./js/app.js 这种相对路径，必须落在 /canvas/ 目录下才算对
  const noSlash = await doctor.req('/canvas')
  ok('/canvas（不带斜杠）重定向到 /canvas/',
    noSlash.status === 302 && noSlash.headers.get('location') === '/canvas/', { status: noSlash.status, loc: noSlash.headers.get('location') })

  const canvasDoc = await doctor.req('/canvas/')
  ok('/canvas/ 医生可打开且注入了归属脚本',
    canvasDoc.status === 200 && canvasDoc.text.includes('canvas-bridge.js') && canvasDoc.text.includes('./js/app.js'), canvasDoc.status)

  const css = await doctor.req('/canvas/style.css')
  ok('画布样式表 /canvas/style.css 可达', css.status === 200 && css.text.includes('--'), css.status)
  const appJs = await doctor.req('/canvas/js/app.js')
  ok('画布脚本 /canvas/js/app.js 可达', appJs.status === 200 && appJs.text.includes('import'), appJs.status)
  for (const m of ['store', 'panels', 'inspector', 'canvas', 'layout', 'ui', 'api']) {
    const r = await doctor.req('/canvas/js/' + m + '.js')
    ok(`画布依赖 /canvas/js/${m}.js 可达`, r.status === 200 && r.text.length > 200, r.status)
  }
  const bridge = await doctor.req('/p/js/canvas-bridge.js')
  ok('归属注入脚本 /p/js/canvas-bridge.js 可达', bridge.status === 200 && bridge.text.includes('/canvas/js/store.js'), bridge.status)
}

console.log('\n[4] 医生提交 → 管理员审核 → 落盘 + 归属')
{
  // 每次跑都用一个临时触发词，保证「有改动可提交」，跑完再还原
  const CANON = ['头后面痛', '后脖子痛', '后脑勺痛', '风池痛']
  const token = '自测' + Date.now().toString(36)
  const payload = {
    updated: [{ name: 'fengchi_tong', trigger: CANON.concat([token]) }],
    dryRun: false
  }
  const sub = await doctor.req('/api/save', { method: 'POST', body: payload })
  ok('医生保存被转成草稿', sub.data.ok === true && sub.data.submitted === true, sub.data)
  const draftId = sub.data.draftId
  ok('草稿带摘要', !!(sub.data.meta && sub.data.meta.fileCount >= 1), sub.data.meta)

  const docApprove = await doctor.req('/api/drafts/' + draftId + '/approve', { method: 'POST', body: {} })
  ok('医生不能自己审核（403）', docApprove.status === 403, docApprove.data)

  const list = await admin.req('/api/drafts?status=pending')
  ok('管理员看到待审列表', list.data.items.some(d => d.id === draftId), list.data.items && list.data.items.length)
  ok('待审条目带提交人', list.data.items[0].author.displayName === '张明远', list.data.items[0].author)

  const detail = await admin.req('/api/drafts/' + draftId)
  ok('详情含逐行 diff', detail.data.draft.files.length >= 1 && Array.isArray(detail.data.draft.files[0].diff), detail.data.draft.files && detail.data.draft.files.length)
  ok('详情标出字段级改动', detail.data.draft.items.some(i => i.name === 'fengchi_tong' && i.field === 'trigger'), detail.data.draft.items)

  const rej = await admin.req('/api/drafts/' + draftId + '/reject', { method: 'POST', body: { note: '' } })
  ok('驳回必须写原因（400）', rej.status === 400, rej.data)

  const ap = await admin.req('/api/drafts/' + draftId + '/approve', { method: 'POST', body: { note: '触发词合理' } })
  ok('审核通过并落盘', ap.data.ok === true && (ap.data.written || []).length >= 1, ap.data)
  ok('登记了字段级归属', ap.data.attributionCount >= 1, ap.data.attributionCount)

  // 审核通过要同时把「谁录入的」写进文件侧 provenance.json（不只是数据库里能查）
  {
    const { readFileSync } = await import('node:fs')
    let prov = null
    for (const p of ['plugins/provenance.json', '../plugins/provenance.json']) {
      try { prov = JSON.parse(readFileSync(p, 'utf8')); break } catch (_) {}
    }
    const rec = prov && prov.nodes ? prov.nodes.fengchi_tong : null
    ok('provenance 记录了录入人', !!rec && rec.by === '张明远', rec)
    ok('provenance 保留了原典出处', !!rec && rec.source === 'shanghanlun', rec && rec.source)
  }

  const attr = await admin.req('/api/attribution/node/fengchi_tong')
  const trig = attr.data.items.find(i => i.field === 'trigger')
  ok('归属能查到 trigger 字段的提供者', !!trig && trig.author.displayName === '张明远', attr.data.items)

  const board = await anon.req('/api/attribution/contributors')
  ok('贡献榜有记录', board.data.items.some(c => c.display_name === '张明远'), board.data.items)

  const graph2 = await doctor.req('/api/graph')
  const node = graph2.data.nodes.find(n => n.name === 'fengchi_tong')
  ok('落盘后条文图已热重载（触发词生效）', !!node && Array.isArray(node.trigger) && node.trigger.includes(token), node && node.trigger)

  // 还原成标准触发词，保证本测试可重复执行
  const restore = await doctor.req('/api/save', { method: 'POST', body: { updated: [{ name: 'fengchi_tong', trigger: CANON }], dryRun: false } })
  const restored = await admin.req('/api/drafts/' + restore.data.draftId + '/approve', { method: 'POST', body: { note: '自测还原' } })
  ok('还原标准触发词', restored.data.ok === true, restored.data)
}

console.log('\n[5] 管理员开通医生')
{
  const users = await admin.req('/api/admin/users?role=doctor')
  const pending = users.data.items.find(u => u.username === 'doctor2')
  // 让本测试可重复执行：如果上一轮已经开通过，先打回待开通
  if (pending && pending.status === 'active') {
    await admin.req('/api/admin/users/' + pending.id + '/status', { method: 'POST', body: { status: 'pending', verified: false } })
    pending.status = 'pending'
  }
  ok('能看到待开通医生', !!pending && pending.status === 'pending', pending)
  const up = await admin.req('/api/admin/users/' + pending.id + '/status', { method: 'POST', body: { status: 'active', verified: true } })
  ok('开通 + 认证成功', up.data.ok && up.data.user.status === 'active' && up.data.user.verified === true, up.data)

  const byPatient = await patient.req('/api/admin/users')
  ok('患者不能访问管理接口（403）', byPatient.status === 403, byPatient.data)
}

console.log('\n[6] 社区')
{
  const p = await patient.req('/api/posts', { method: 'POST', body: { title: '自测帖', body: '这是端到端自测发的帖子', tag: '讨论' } })
  ok('发帖成功', !!p.data.post && p.data.post.id, p.data)
  const pid = p.data.post.id

  const c = await doctor.req('/api/posts/' + pid + '/comments', { method: 'POST', body: { body: '医生来评论一句' } })
  ok('评论成功', c.data.post.comments.length === 1, c.data.post && c.data.post.comments.length)

  const l1 = await doctor.req('/api/posts/' + pid + '/like', { method: 'POST', body: {} })
  ok('点赞成功', l1.data.liked === true && l1.data.likeCount >= 1, l1.data)
  const l2 = await doctor.req('/api/posts/' + pid + '/like', { method: 'POST', body: {} })
  ok('再点一次取消点赞', l2.data.liked === false, l2.data)

  const anonPost = await anon.req('/api/posts', { method: 'POST', body: { body: '匿名发帖' } })
  ok('未登录不能发帖（401）', anonPost.status === 401, anonPost.data)

  const list = await anon.req('/api/posts?tag=讨论')
  ok('按标签筛选可用', list.data.items.length >= 1 && list.data.items.every(x => x.tag === '讨论'), list.data.items.length)

  const detail = await anon.req('/api/posts/' + pid)
  ok('详情带医生认证徽标', detail.data.post.comments[0].author.verified === true, detail.data.post.comments[0].author)

  const del = await patient.req('/api/posts/' + pid, { method: 'DELETE' })
  ok('作者可删除自己的帖子', del.data.ok === true, del.data)
}

console.log('\n[7] 首页聚合')
{
  const h = await patient.req('/api/home')
  ok('首页统计齐全', h.data.stats.total > 200 && h.data.stats.formulas > 100, h.data.stats)
  ok('首页带热帖', Array.isArray(h.data.hotPosts) && h.data.hotPosts.length >= 1, h.data.hotPosts && h.data.hotPosts.length)
  ok('首页带贡献榜', h.data.contributors.length >= 1, h.data.contributors)
  ok('首页带我的记录', h.data.myConsults.length >= 1, h.data.myConsults.length)
}

console.log('\n[8] 每个账号自己的大模型 API 配置')
{
  const FAKE = 'sk-selftest' + Date.now().toString(36)
  const { q } = await import('./db.js')

  const anonCfg = await anon.req('/api/llm/config')
  ok('未登录不能读写 API 配置（401）', anonCfg.status === 401, anonCfg.data)

  const d0 = await doctor.req('/api/llm/config')
  ok('医生初始未配置', d0.data.config.configured === false, d0.data.config)
  ok('未配置时不返回任何 key 片段', (d0.data.config.keyMask || '') === '', d0.data.config.keyMask)

  const bad = await doctor.req('/api/llm/config', { method: 'POST', body: { apiKey: FAKE, baseUrl: 'api.deepseek.com' } })
  ok('Base URL 缺 http(s) 被拒（400）', bad.status === 400, bad.data)

  const saved = await doctor.req('/api/llm/config', { method: 'POST', body: { apiKey: FAKE, baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', enabled: true } })
  ok('医生保存自己的 Key 成功', saved.data.ok === true && saved.data.config.configured === true, saved.data.config)
  ok('返回的是掩码不是明文', saved.data.config.keyMask.includes('••••') && !JSON.stringify(saved.data).includes(FAKE), saved.data.config.keyMask)
  ok('掩码保留后四位', saved.data.config.keyMask.endsWith(FAKE.slice(-4)), saved.data.config.keyMask)
  ok('当前生效来源=我的 key', saved.data.config.source === 'user', saved.data.config.source)

  const raw = q.get('SELECT key_cipher FROM user_api_keys WHERE user_id = (SELECT id FROM users WHERE username = ?)', 'doctor')
  ok('库里存的是密文，不含明文', !!raw && raw.key_cipher.startsWith('v1.') && !raw.key_cipher.includes(FAKE), raw && raw.key_cipher.slice(0, 24))

  const p0 = await patient.req('/api/llm/config')
  ok('患者的配置和医生的完全隔离', p0.data.config.configured === false && (p0.data.config.keyMask || '') === '', p0.data.config)

  const meDoc = await doctor.req('/api/auth/me')
  const mePat = await patient.req('/api/auth/me')
  ok('医生 me 显示用我的 key', meDoc.data.llm && meDoc.data.llm.source === 'user', meDoc.data.llm)
  ok('患者 me 仍是无 key', mePat.data.llm && mePat.data.llm.configured === false, mePat.data.llm)

  const newDoc = await doctor.req('/api/new')
  const newPat = await patient.req('/api/new')
  ok('医生新会话 hasLLM=true（用他自己的 key）', newDoc.data.hasLLM === true, newDoc.data.hasLLM)
  ok('患者新会话 hasLLM=false（不会偷用别人的 key）', newPat.data.hasLLM === false, newPat.data.hasLLM)

  const t1 = await patient.req('/api/llm/test', { method: 'POST', body: {} })
  ok('没 key 的人测试连接被拒（400）', t1.status === 400, t1.data)

  const t2 = await doctor.req('/api/llm/test', { method: 'POST', body: { apiKey: FAKE, baseUrl: 'http://127.0.0.1:9' } })
  ok('连通性测试能优雅失败（返回错误而不是 500）', t2.status === 200 && t2.data.ok === false && !!t2.data.error, t2.data)

  const off = await doctor.req('/api/llm/config', { method: 'POST', body: { enabled: false } })
  ok('可以只关开关、保留 key', off.data.config.enabled === false && off.data.config.configured === true, off.data.config)
  ok('关掉后不再生效', off.data.config.source !== 'user', off.data.config.source)

  const cleared = await doctor.req('/api/llm/config', { method: 'DELETE' })
  ok('删除配置成功', cleared.data.config.configured === false, cleared.data.config)
  const newDoc2 = await doctor.req('/api/new')
  ok('删除后 hasLLM 回到 false', newDoc2.data.hasLLM === false, newDoc2.data.hasLLM)
}

console.log('\n[9] 静态页面')
{
  for (const [path, needle] of [['/', '辨证社区'], ['/login', '演示账号'], ['/consult', 'consult-app'], ['/community', '社区讨论'], ['/doctor', '条文工作台'], ['/review', '审核台'], ['/settings', '设置'], ['/me', '我的'], ['/p/css/app.css', '--grad']]) {
    const r = await anon.req(path)
    ok(`GET ${path} 可访问`, r.status === 200 && r.text.includes(needle), { status: r.status })
  }
  const app = await anon.req('/consult-app')
  ok('问诊模块（原 web/index.html）可访问', app.status === 200 && app.text.includes('中医辨证助手'), app.status)
}

console.log('\n============================================')
console.log(`端到端结果: ${pass} 通过, ${fail} 失败`)
if (fail) process.exitCode = 1
