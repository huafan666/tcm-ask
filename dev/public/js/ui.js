// dev/public/js/ui.js
// 通用界面小工具：提示条、弹窗、确认框、HTML 转义

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** 由 HTML 字符串生成元素 */
export function el(html) {
  const d = document.createElement('div')
  d.innerHTML = html.trim()
  return d.firstElementChild
}

/** 绑定事件（选择器在 root 内查找） */
export function on(root, selector, evt, fn) {
  root.querySelectorAll(selector).forEach(x => x.addEventListener(evt, fn))
}

// ------------------------------------------------------------
// 提示条
// ------------------------------------------------------------

export function toast(msg, kind, ms) {
  const host = document.getElementById('toast-host')
  if (!host) return
  const t = el(`<div class="toast toast-${kind || 'ok'}">${esc(msg)}</div>`)
  host.appendChild(t)
  setTimeout(() => {
    t.style.transition = 'opacity .25s'
    t.style.opacity = '0'
    setTimeout(() => t.remove(), 260)
  }, ms || (kind === 'err' ? 7000 : 3200))
}

// ------------------------------------------------------------
// 弹窗
// ------------------------------------------------------------

let escHandler = null

export function openModal(opts) {
  const host = document.getElementById('modal-host')
  const modal = document.getElementById('modal')
  const o = opts || {}
  modal.style.width = o.width || ''
  modal.innerHTML = ''

  const head = el(`<div class="modal-head"><h3>${esc(o.title || '')}</h3><button class="modal-x" title="关闭">×</button></div>`)
  const body = el('<div class="modal-body"></div>')
  const foot = el('<div class="modal-foot"></div>')

  modal.appendChild(head)
  modal.appendChild(body)
  modal.appendChild(foot)

  if (typeof o.body === 'function') o.body(body)
  else body.innerHTML = o.body || ''

  const close = () => {
    host.classList.add('hidden')
    if (escHandler) { document.removeEventListener('keydown', escHandler, true); escHandler = null }
    if (o.onClose) o.onClose()
  }

  head.querySelector('.modal-x').addEventListener('click', close)
  host.onclick = e => { if (e.target === host) close() }

  ;(o.buttons || []).forEach(b => {
    const btn = el(`<button class="btn ${b.kind === 'primary' ? 'btn-primary' : (b.kind === 'danger' ? 'btn-danger' : (b.kind === 'ghost' ? 'btn-ghost' : ''))}">${esc(b.label)}</button>`)
    btn.disabled = !!b.disabled
    btn.addEventListener('click', () => b.onClick && b.onClick(close, body))
    foot.appendChild(btn)
  })

  escHandler = e => { if (e.key === 'Escape') { e.stopPropagation(); close() } }
  document.addEventListener('keydown', escHandler, true)

  host.classList.remove('hidden')
  return { body, foot, close, head }
}

export function closeModal() {
  const host = document.getElementById('modal-host')
  if (host) host.classList.add('hidden')
}

/** 确认框 → Promise<boolean> */
export function confirmDialog(opts) {
  const o = opts || {}
  return new Promise(resolve => {
    let done = false
    const finish = v => { if (!done) { done = true; resolve(v) } }
    openModal({
      title: o.title || '确认',
      width: 'min(620px,92vw)',
      body: `<div class="modal-note">${o.message || ''}</div>`,
      buttons: [
        { label: o.cancelLabel || '取消', onClick: c => { finish(false); c() } },
        { label: o.okLabel || '确定', kind: o.kind || 'primary', onClick: c => { finish(true); c() } }
      ],
      onClose: () => finish(false)
    })
  })
}

/** 输入框对话框 → Promise<string|null> */
export function promptDialog(opts) {
  const o = opts || {}
  return new Promise(resolve => {
    let done = false
    const finish = v => { if (!done) { done = true; resolve(v) } }
    const m = openModal({
      title: o.title || '输入',
      width: 'min(560px,92vw)',
      body: `<div class="form-row">
          <div class="form-label">${esc(o.label || '')}</div>
          <input class="input" id="pd-input" value="${esc(o.value || '')}" placeholder="${esc(o.placeholder || '')}">
          <div class="hint" id="pd-err"></div>
        </div>`,
      buttons: [
        { label: '取消', onClick: c => { finish(null); c() } },
        {
          label: o.okLabel || '确定',
          kind: 'primary',
          onClick: (c, body) => {
            const v = body.querySelector('#pd-input').value.trim()
            if (o.validate) {
              const err = o.validate(v)
              if (err) { body.querySelector('#pd-err').textContent = err; return }
            }
            finish(v)
            c()
          }
        }
      ],
      onClose: () => finish(null)
    })
    const input = m.body.querySelector('#pd-input')
    setTimeout(() => { input.focus(); input.select() }, 30)
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.stopPropagation(); m.foot.querySelectorAll('.btn')[1].click() }
    })
  })
}

/** 只读代码/源码展示 */
export function showSourceDialog(title, text) {
  openModal({
    title,
    width: 'min(820px,94vw)',
    body: `<div class="modal-note">只读预览（这是磁盘上的真实内容）</div>
           <pre class="diff"><span class="dl-ctx">${esc(text || '（空）')}</span></pre>`,
    buttons: [{ label: '关闭', onClick: c => c() }]
  })
}
