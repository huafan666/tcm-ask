'use strict'
// platform/seed.js
// ============================================================
// 演示数据：跑一次就有账号、帖子、待审草稿，可以直接点着看
//   管理员 admin / admin123
//   医生   doctor / doctor123（已认证、可提交条文）
//   医生   doctor2 / doctor123（待开通，用来演示「管理员开通」）
//   患者   patient / patient123
//
// 可重复执行：已存在的账号/帖子会跳过。
// ============================================================

const { q, now } = require('./db')
const auth = require('./auth')
const community = require('./community')

function ensureUser(spec) {
  const exist = auth.findByUsername(spec.username)
  if (exist) {
    console.log(`  · 已存在，跳过：${spec.username}`)
    return auth.publicUser(exist)
  }
  if (spec.role === 'admin') {
    const u = auth.createAdmin({ username: spec.username, password: spec.password, displayName: spec.displayName })
    console.log(`  · 新建管理员：${spec.username}`)
    return u
  }
  const out = auth.register(spec)
  if (spec.status === 'active' && spec.role === 'doctor') {
    q.run("UPDATE users SET status = 'active', verified = ? WHERE id = ?", spec.verified ? 1 : 0, out.user.id)
  }
  if (spec.bio || spec.specialty) {
    q.run('UPDATE users SET bio = ?, specialty = ? WHERE id = ?', spec.bio || '', spec.specialty || '', out.user.id)
  }
  console.log(`  · 新建${spec.role === 'doctor' ? '医生' : '患者'}：${spec.username}（${spec.status || 'active'}）`)
  return auth.findById(out.user.id)
}

function ensurePost(author, { title, body, tag }) {
  const exist = q.get('SELECT id FROM posts WHERE author_id = ? AND title = ?', author.id, title || '')
  if (exist) { console.log(`  · 帖子已存在，跳过：${title}`); return exist.id }
  const post = community.createPost(author, { title, body, tag })
  console.log(`  · 新建帖子：${title}`)
  return post.id
}

console.log('')
console.log('=== 初始化平台演示数据 ===')

const admin = ensureUser({ username: 'admin', password: 'admin123', displayName: '平台管理员', role: 'admin' })
const doctor = ensureUser({
  username: 'doctor', password: 'doctor123', displayName: '张明远', role: 'doctor',
  status: 'active', verified: true, specialty: '伤寒论 · 脾胃病',
  bio: '临床十余年，专注经方与条文的结构化整理。'
})
const doctor2 = ensureUser({
  username: 'doctor2', password: 'doctor123', displayName: '李静', role: 'doctor',
  status: 'pending', verified: false, specialty: '妇科 · 经方'
})
const patient = ensureUser({
  username: 'patient', password: 'patient123', displayName: '小王', role: 'patient',
  bio: '长期怕冷、容易拉肚子，来学点中医常识。'
})

const p1 = ensurePost(doctor, {
  title: '「心下悸」和「心动悸」到底要不要合并？',
  body: '整理条文时发现这两个节点在画布上是分开的，但病人说「心悸」时两个都会被触发。\n\n' +
    '我的理解：心下悸偏胃脘部的水气上冲（茯苓甘草汤、真武汤那一路），心动悸偏心脏本身（炙甘草汤「脉结代、心动悸」）。\n' +
    '所以触发词最好别共用「心悸」两个字，或者干脆合并成一个节点、把区别交给依赖条件去区分。',
  tag: '条文'
})
const p2 = ensurePost(patient, {
  title: '怕冷、不出汗、后脖子发僵，问了十几个问题才出结论',
  body: '第一次用这个问诊，感觉它问得挺细。我一开始只说「怕冷、有点头痛」，后面它一个个问有没有出汗、口渴不渴、脖子僵不僵，最后给的是葛根汤的方向。\n\n有个建议：能不能一次把常见的那几项都列出来让我勾选？',
  tag: '求问'
})
const p3 = ensurePost(doctor, {
  title: '给病人提问，为什么一定要「是不是」开头',
  body: '试过两种问法：\n' +
    'A「你的脉象如何？」——病人答不上来。\n' +
    'B「是不是有人给你把过脉，说脉浮在表面、轻轻一摸就摸到？」——病人能答。\n\n' +
    '条文是给医生看的，问题得给病人看。所以每个症状的反问都应该是「是 / 否 / 不清楚」能答完的一句话。',
  tag: '科普'
})

if (p1) {
  const hasC = q.get('SELECT id FROM comments WHERE post_id = ? AND author_id = ?', p1, patient.id)
  if (!hasC) {
    community.addComment(patient, p1, '作为病人我确实分不清这两种，能答的只有「心口跳得慌」这一句。')
    community.addComment(doctor2, p1, '建议保留两个节点，但把「心悸」这个笼统说法只挂在心动悸上，心下悸用「心口/心窝跳」来触发。')
    console.log('  · 新建评论 2 条')
  }
}
if (p2) {
  const hasC = q.get('SELECT id FROM comments WHERE post_id = ? AND author_id = ?', p2, doctor.id)
  if (!hasC) {
    community.addComment(doctor, p2, '好建议。现在的设计是一次问一个、按区分度排序，避免一上来就丢一张大表给病人。勾选式会做成可选项。')
    console.log('  · 新建评论 1 条')
  }
}
for (const pid of [p1, p2, p3]) {
  if (!pid) continue
  for (const uid of [doctor.id, patient.id, admin.id]) {
    if (uid === doctor.id && pid === p1) continue
    const has = q.get('SELECT 1 AS x FROM likes WHERE post_id = ? AND user_id = ?', pid, uid)
    if (!has) q.run('INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)', pid, uid, now())
  }
}

// ---- 一份待审条文草稿：演示「医生提交 → 管理员审核」 ----
const existDraft = q.get('SELECT id FROM drafts WHERE author_id = ? AND status = ?', doctor.id, 'pending')
if (!existDraft) {
  const payload = {
    updated: [
      {
        name: 'zugengtong',
        trigger: ['脚后跟痛', '足跟痛', '后跟痛', '脚跟疼']
      }
    ]
  }
  const res = q.run(
    `INSERT INTO drafts (author_id, title, summary, payload, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    doctor.id,
    '足跟痛：补充口语触发词',
    '1 个节点 · 1 个文件 · 补充「后跟痛 / 脚跟疼」两种病人常用说法',
    JSON.stringify(payload),
    now()
  )
  console.log(`  · 新建待审草稿 #${res.lastInsertRowid}（足跟痛：补充口语触发词）`)
}

console.log('')
console.log('=== 完成 ===')
console.log('  管理员  admin   / admin123')
console.log('  医生    doctor  / doctor123  （已认证）')
console.log('  医生    doctor2 / doctor123  （待开通，可在审核台开通）')
console.log('  患者    patient / patient123')
console.log('')
