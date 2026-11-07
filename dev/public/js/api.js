// dev/public/js/api.js
// 与开发端服务器通信的极简封装（无依赖）

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
    throw new Error('无法连接开发端服务器（它还在运行吗？）：' + e.message)
  }
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (_) {
    throw new Error('服务端返回了非 JSON 内容（HTTP ' + res.status + '）：' + text.slice(0, 200))
  }
  if (res.status >= 500) throw new Error(data.error || ('服务端错误 HTTP ' + res.status))
  return data
}

export const getGraph = () => req('/api/graph')
export const getSource = name => req('/api/source?name=' + encodeURIComponent(name))
export const getReverse = (name, depth) => req('/api/reverse?name=' + encodeURIComponent(name) + '&depth=' + (depth || 10))
export const getStatus = () => req('/api/status')
export const postSimulate = assignments => req('/api/simulate', { method: 'POST', body: { assignments } })
export const postWalk = input => req('/api/walkthrough', { method: 'POST', body: input })
export const postLayout = layout => req('/api/layout', { method: 'POST', body: layout })
export const postSave = payload => req('/api/save', { method: 'POST', body: payload })
export const postReloadMain = () => req('/api/reload-main', { method: 'POST', body: {} })
