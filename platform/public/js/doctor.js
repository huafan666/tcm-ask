// platform/public/js/doctor.js
// 医生工作台：进画布录条文 / 看自己的提交与审核结果 / 看自己提供过的条文
import { api } from './api.js'
import { bootShell, esc, timeAgo, toast, modal, $ } from './shell.js'

const shell = await bootShell('doctor', { requireRole: ['doctor', 'admin'] })
const user = shell.user
const pending = user.role === 'doctor' && user.status === 'pending'

const STATUS_BADGE = {
  pending: '<span class="badge badge-pending">待审核</span>',
  approved: '<span class="badge badge-ok">已入库</span>',
  rejected: '<span class="badge badge-no">已驳回</span>'
}

$('#notice-slot').innerHTML = pending
  ? `<div class="card" style="border-color:#f5d9a8;background:#fffaf0">
       <div class="row"><b>账号待开通</b><span class="badge badge-pending">待管理员开通</span></div>
       <div class="small muted" style="margin-top:6px">管理员开通后你才能提交条文。现在可以先在社区讨论、熟悉画布。</div>
     </div>`
  : ''

$('#canvas-slot').innerHTML = `
  <div class="card">
    <div class="spread">
      <div>
        <h3>条文录入画布</h3>
        <div class="small muted" style="margin-top:4px">
          就是开发端那套可视化画布（症状 → 证候 → 方剂）。在画布上改完点「保存」＝<b>提交审核</b>，
          不会直接改磁盘；管理员在审核台看过逐行 diff 才会落盘。
        </div>
      </div>
      <a class="btn btn-grad" href="/canvas/" target="_blank" rel="noopener" ${pending ? 'style="pointer-events:none;opacity:.5"' : ''}>打开画布</a>
    </div>
    <div class="hr"></div>
    <div class="row-wrap">
      <span class="badge badge-soft">提交时自动登记：谁 · 改了哪个节点的哪个字段</span>
      <span class="badge badge-soft">画布右下角显示「本条文的提供者」</span>
      <span class="badge badge-soft">管理员可在审核台逐行看 diff</span>
    </div>
  </div>`

// ---------------- 我的提交 ----------------
let drafts = []
try { drafts = (await api.drafts('?mine=1')).items } catch (e) { toast(e.message, 'err') }

$('#drafts-slot').innerHTML = `
  <div class="card" style="margin-top:16px;padding:0;overflow:hidden">
    <div class="card-head">
      <h3>我的提交</h3>
      <span class="tiny dim">共 ${drafts.length} 份</span>
    </div>
    ${drafts.length ? `<div class="list">${drafts.map(d => `
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">${esc(d.title)} ${STATUS_BADGE[d.status] || ''}</div>
          <div class="list-sub">${timeAgo(d.createdAt)} · ${esc(d.summary)}
            ${d.reviewer ? ' · 审核人 ' + esc(d.reviewer.displayName) : ''}</div>
          ${d.reviewNote ? `<div class="tiny" style="margin-top:4px;color:#b7791f">审核意见：${esc(d.reviewNote)}</div>` : ''}
        </div>
        <button class="btn btn-sm" data-draft="${d.id}">看详情</button>
      </div>`).join('')}</div>` : '<div class="empty">还没有提交过条文</div>'}
  </div>`

document.querySelectorAll('[data-draft]').forEach(btn => {
  btn.onclick = async () => {
    try {
      const { draft } = await api.draft(btn.dataset.draft)
      const filesHtml = (draft.files || []).map(f => {
        const adds = (f.diff || []).filter(d => d.t === '+').length
        const dels = (f.diff || []).filter(d => d.t === '-').length
        const lines = (f.diff || []).map(d => {
          const cls = d.t === '+' ? 'dl-add' : d.t === '-' ? 'dl-del' : 'dl-ctx'
          return `<span class="${cls}">${esc(d.t === ' ' ? '  ' + d.s : d.t + ' ' + d.s)}</span>`
        }).join('')
        return `<div class="diff-file">
          <div class="diff-head"><span>${esc(f.relPath)}</span><span>+${adds} −${dels}</span></div>
          <pre class="diff-body">${lines}</pre>
        </div>`
      }).join('')
      modal({
        title: '草稿 #' + draft.id + ' · ' + draft.title,
        body: `
          <div class="row-wrap" style="margin-bottom:8px">
            ${STATUS_BADGE[draft.status] || ''}
            <span class="tiny dim">${timeAgo(draft.createdAt)}</span>
          </div>
          <div class="small muted">影响节点：${(draft.items || []).map(i => esc(i.name) + '(' + esc(i.fieldLabel) + ')').join('、')}</div>
          ${draft.errors && draft.errors.length ? `<div class="badge badge-no" style="margin-top:8px">校验问题：${draft.errors.map(esc).join('；')}</div>` : ''}
          ${filesHtml || '<div class="small muted">没有文件改动</div>'}
          ${draft.reviewNote ? `<div class="hint" style="margin-top:10px">审核意见：${esc(draft.reviewNote)}</div>` : ''}`
      })
    } catch (e) { toast(e.message, 'err') }
  }
})

// ---------------- 我提供过的条文（字段级归属） ----------------
let map = {}
try { map = (await api.attributionMap()).map } catch (_) {}

const mineNodes = Object.entries(map)
  .filter(([, fields]) => Object.values(fields).some(f => f.displayName === user.displayName))
  .map(([node, fields]) => ({
    node,
    fields: Object.entries(fields).filter(([, f]) => f.displayName === user.displayName)
  }))

$('#mine-slot').innerHTML = `
  <div class="card" style="margin-top:16px;padding:0;overflow:hidden">
    <div class="card-head">
      <h3>我提供过的条文</h3>
      <span class="tiny dim">${mineNodes.length} 个节点</span>
    </div>
    ${mineNodes.length ? `<div class="list">${mineNodes.map(n => `
      <div class="list-item">
        <div class="list-main">
          <div class="list-title mono">${esc(n.node)}</div>
          <div class="list-sub">${n.fields.map(([field, f]) => esc(f.fieldLabel)).join('、')}</div>
        </div>
        <span class="tiny dim">${timeAgo(n.fields[0][1].at)}</span>
      </div>`).join('')}</div>`
      : '<div class="empty">审核通过后，你提供的条文会在这里逐字段列出来</div>'}
  </div>`

// ---------------- 右侧栏 ----------------
$('#aside').innerHTML = `
  <div class="card">
    <h3 style="margin-bottom:10px">录入流程</h3>
    <div class="small muted" style="line-height:1.9">
      1. 打开画布，改条文（改标题/触发词/反问话术/依赖条件）<br>
      2. 点「保存」→ 先看逐行 diff → 确认 → <b>提交审核</b><br>
      3. 管理员在审核台通过 → 自动写盘 + 通知引擎热重载<br>
      4. 你的名字会挂在这些字段上（可追溯）
    </div>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">注意</h3>
    <div class="small muted" style="line-height:1.9">
      · 提交后条文不会立刻生效，管理员通过才入库。<br>
      · 驳回会写明原因，你可以在画布上改完再提交。<br>
      · 画布右下角面板显示当前选中节点每个字段的提供者。
    </div>
  </div>`
