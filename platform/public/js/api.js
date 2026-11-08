// platform/public/js/api.js
// 与平台服务通信的极简封装（无依赖）

async function req(path, opts) {
  const o = Object.assign({ headers: {} }, opts || {})
  if (o.body !== undefined) {
    o.headers['Content-Type'] = 'application/json'
    o.body = JSON.stringify(o.body)
  }
  let res
  try {
    res = await fetch(path, o)
  } catch (e) {
    throw new Error('连不上平台服务（它还在运行吗？）：' + e.message)
  }
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (_) {
    throw new Error('服务端返回了非 JSON 内容（HTTP ' + res.status + '）：' + text.slice(0, 200))
  }
  if (res.status >= 400) {
    const err = new Error(data.error || ('请求失败 HTTP ' + res.status))
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  // 账号
  me: () => req('/api/auth/me'),
  login: body => req('/api/auth/login', { method: 'POST', body }),
  register: body => req('/api/auth/register', { method: 'POST', body }),
  logout: () => req('/api/auth/logout', { method: 'POST', body: {} }),
  updateProfile: body => req('/api/auth/profile', { method: 'POST', body }),

  // 每个账号自己的大模型 API 配置
  llmConfig: () => req('/api/llm/config'),
  llmSave: body => req('/api/llm/config', { method: 'POST', body }),
  llmClear: () => req('/api/llm/config', { method: 'DELETE', body: {} }),
  llmTest: body => req('/api/llm/test', { method: 'POST', body }),

  // 首页 / 统计
  home: () => req('/api/home'),
  contributors: () => req('/api/attribution/contributors'),
  attributionMap: () => req('/api/attribution/map'),
  attributionNode: name => req('/api/attribution/node/' + encodeURIComponent(name)),

  // 问诊记录
  history: () => req('/api/consult/history'),
  historyDetail: id => req('/api/consult/history/' + encodeURIComponent(id)),

  // 社区
  posts: (query = '') => req('/api/posts' + query),
  post: id => req('/api/posts/' + id),
  createPost: body => req('/api/posts', { method: 'POST', body }),
  comment: (id, body) => req('/api/posts/' + id + '/comments', { method: 'POST', body: { body } }),
  like: id => req('/api/posts/' + id + '/like', { method: 'POST', body: {} }),
  deletePost: id => req('/api/posts/' + id, { method: 'DELETE', body: {} }),

  // 条文草稿 / 审核
  drafts: (query = '') => req('/api/drafts' + query),
  draft: id => req('/api/drafts/' + id),
  approve: (id, note) => req('/api/drafts/' + id + '/approve', { method: 'POST', body: { note } }),
  reject: (id, note) => req('/api/drafts/' + id + '/reject', { method: 'POST', body: { note } }),

  // 管理
  overview: () => req('/api/admin/overview'),
  users: (query = '') => req('/api/admin/users' + query),
  setUserStatus: (id, body) => req('/api/admin/users/' + id + '/status', { method: 'POST', body })
}
