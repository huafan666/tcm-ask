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

console.log('\n[8] 静态页面')
{
  for (const [path, needle] of [['/', '辨证社区'], ['/login', '演示账号'], ['/consult', 'consult-app'], ['/community', '社区讨论'], ['/doctor', '条文工作台'], ['/review', '审核台'], ['/me', '我的'], ['/p/css/app.css', '--grad']]) {
    const r = await anon.req(path)
    ok(`GET ${path} 可访问`, r.status === 200 && r.text.includes(needle), { status: r.status })
  }
  const app = await anon.req('/consult-app')
  ok('问诊模块（原 web/index.html）可访问', app.status === 200 && app.text.includes('中医辨证助手'), app.status)
}

console.log('\n============================================')
console.log(`端到端结果: ${pass} 通过, ${fail} 失败`)
if (fail) process.exitCode = 1
