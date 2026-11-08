// platform/public/js/auth.js
import { api } from './api.js'
import { $, toast, esc } from './shell.js'

const params = new URLSearchParams(location.search)
const next = params.get('next') || '/'
let mode = 'login'

function setMode(m) {
  mode = m
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === m))
  $('#display-field').style.display = m === 'register' ? '' : 'none'
  $('#role-field').style.display = m === 'register' ? '' : 'none'
  $('#submit').textContent = m === 'register' ? '注册' : '登录'
  syncSpecialty()
}

function syncSpecialty() {
  const show = mode === 'register' && $('#role').value === 'doctor'
  $('#specialty-field').style.display = show ? '' : 'none'
}

document.querySelectorAll('.auth-tab').forEach(t => { t.onclick = () => setMode(t.dataset.mode) })
$('#role').onchange = syncSpecialty

$('#form').onsubmit = async e => {
  e.preventDefault()
  const username = $('#username').value.trim()
  const password = $('#password').value
  const msg = $('#msg')
  msg.textContent = ''
  try {
    if (mode === 'login') {
      await api.login({ username, password })
      location.href = next
      return
    }
    const body = {
      username, password,
      displayName: $('#displayName').value.trim(),
      role: $('#role').value,
      specialty: $('#specialty').value.trim()
    }
    const r = await api.register(body)
    if (r.needsApproval) {
      msg.innerHTML = '<span style="color:#b7791f">注册成功，医生账号需要管理员开通后才能录入条文。现在可以先登录问诊与逛社区。</span>'
    }
    await api.login({ username, password })
    location.href = r.needsApproval ? '/me' : next
  } catch (err) {
    msg.innerHTML = '<span style="color:#e0245e">' + esc(err.message) + '</span>'
  }
}

setMode('login')
api.me().then(r => { if (r.user) location.href = next }).catch(() => {})
