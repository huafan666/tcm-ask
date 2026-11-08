// platform/public/js/community.js
// 社区：发帖 / 评论 / 点赞 / 医生认证徽标
import { api } from './api.js'
import { bootShell, esc, timeAgo, avatar, roleBadge, toast, $, $$ } from './shell.js'

const shell = await bootShell('community')
const user = shell.user

const params = new URLSearchParams(location.search)
const postId = params.get('id')
const activeTag = params.get('tag') || ''

let tags = ['讨论', '条文', '医案', '求问', '科普']

// ---------------- 详情视图 ----------------
if (postId) {
  await renderDetail(postId)
} else {
  await renderList()
}

async function renderDetail(id) {
  let post
  try { post = (await api.post(id)).post } catch (e) { toast(e.message, 'err'); return }
  $('#page-title').textContent = '帖子详情'
  $('#page-sub').textContent = post.tag + ' · ' + timeAgo(post.createdAt)
  $('#composer-slot').innerHTML = ''
  $('#tag-slot').innerHTML = ''

  $('#feed-slot').innerHTML = `
    <article class="post">
      <div class="post-head">
        ${avatar(post.author)}
        <div>
          <div class="post-author">${esc(post.author.displayName)} ${roleBadge(post.author)}</div>
          <div class="post-time">${timeAgo(post.createdAt)}${post.author.specialty ? ' · ' + esc(post.author.specialty) : ''}</div>
        </div>
      </div>
      ${post.title ? `<h2 class="post-title" style="font-size:19px">${esc(post.title)}</h2>` : ''}
      <div class="post-body">${esc(post.body)}</div>
      <div class="post-actions">
        <button class="icon-btn ${post.liked ? 'liked' : ''}" id="btn-like">♡ <span id="like-n">${post.likeCount}</span></button>
        <span class="icon-btn">💬 ${post.comments.length}</span>
        ${user && (user.id === post.author.id || user.role === 'admin')
          ? '<button class="icon-btn" id="btn-del" style="margin-left:auto;color:#e0245e">删除</button>' : ''}
      </div>
    </article>

    <div class="card" style="margin-top:14px">
      <h3 style="margin-bottom:6px">评论 ${post.comments.length}</h3>
      <div id="comments">
        ${post.comments.length ? post.comments.map(c => `
          <div class="comment">
            ${avatar(c.author, 'avatar-sm')}
            <div class="comment-body">
              <div class="comment-meta">${esc(c.author.displayName)} ${roleBadge(c.author)}
                <span class="tiny dim" style="font-weight:400">${timeAgo(c.createdAt)}</span></div>
              <div class="small" style="white-space:pre-wrap;margin-top:4px">${esc(c.body)}</div>
            </div>
          </div>`).join('') : '<div class="small muted" style="padding:10px 0">还没有评论</div>'}
      </div>
      ${user ? `
        <div style="margin-top:14px" class="stack">
          <textarea class="textarea" id="comment-body" placeholder="说说你的看法…" style="min-height:80px"></textarea>
          <div class="right"><button class="btn btn-primary btn-sm" id="btn-comment">发表评论</button></div>
        </div>` : '<div class="hint" style="margin-top:12px"><a href="/login?next=/community?id=' + post.id + '">登录</a>后可以评论</div>'}
    </div>`

  const likeBtn = $('#btn-like')
  if (likeBtn) likeBtn.onclick = async () => {
    if (!user) { location.href = '/login?next=/community?id=' + post.id; return }
    try {
      const r = await api.like(post.id)
      likeBtn.classList.toggle('liked', r.liked)
      $('#like-n').textContent = r.likeCount
    } catch (e) { toast(e.message, 'err') }
  }

  const delBtn = $('#btn-del')
  if (delBtn) delBtn.onclick = async () => {
    if (!confirm('确定删除这个帖子？')) return
    try { await api.deletePost(post.id); toast('已删除', 'ok'); location.href = '/community' } catch (e) { toast(e.message, 'err') }
  }

  const cBtn = $('#btn-comment')
  if (cBtn) cBtn.onclick = async () => {
    const body = $('#comment-body').value.trim()
    if (!body) { toast('先写点什么', 'warn'); return }
    try {
      await api.comment(post.id, body)
      location.reload()
    } catch (e) { toast(e.message, 'err') }
  }

  renderAside()
  return
}

// ---------------- 列表视图 ----------------
async function renderList() {
  let data
  try { data = await api.posts('?tag=' + encodeURIComponent(activeTag)) } catch (e) { toast(e.message, 'err'); data = { items: [] } }
  tags = data.tags || tags

  $('#composer-slot').innerHTML = user ? `
    <div class="card">
      <div class="composer">
        <div class="row">
          ${avatar(user, 'avatar-sm')}
          <input class="input" id="post-title" placeholder="标题（可选）">
        </div>
        <textarea class="textarea" id="post-body" placeholder="聊聊条文、贴个医案，或者提问…"></textarea>
        <div class="spread">
          <select class="select" id="post-tag" style="width:auto">
            ${tags.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="btn-post">发布</button>
        </div>
      </div>
    </div>` : `
    <div class="card">
      <div class="spread">
        <div class="small muted">登录后可以发帖、评论、点赞</div>
        <a class="btn btn-primary btn-sm" href="/login?next=/community">去登录</a>
      </div>
    </div>`

  $('#tag-slot').innerHTML = ['全部', ...tags].map(t => `
    <a class="tag ${(t === '全部' && !activeTag) || t === activeTag ? 'active' : ''}"
       href="/community${t === '全部' ? '' : '?tag=' + encodeURIComponent(t)}">${t}</a>`).join('')

  $('#feed-slot').innerHTML = (data.items || []).length
    ? data.items.map(p => `
      <article class="post">
        <div class="post-head">
          ${avatar(p.author, 'avatar-sm')}
          <div style="flex:1">
            <div class="post-author">${esc(p.author.displayName)} ${roleBadge(p.author)}</div>
            <div class="post-time">${timeAgo(p.createdAt)} · ${esc(p.tag)}</div>
          </div>
        </div>
        <a href="/community?id=${p.id}">
          ${p.title ? `<div class="post-title">${esc(p.title)}</div>` : ''}
          <div class="post-body">${esc(p.body.slice(0, 260))}${p.body.length > 260 ? '…' : ''}</div>
        </a>
        <div class="post-actions">
          <button class="icon-btn ${p.liked ? 'liked' : ''}" data-like="${p.id}">♡ <span>${p.likeCount}</span></button>
          <a class="icon-btn" href="/community?id=${p.id}">💬 ${p.commentCount}</a>
        </div>
      </article>`).join('')
    : '<div class="empty">还没有讨论，来发第一帖</div>'

  const postBtn = $('#btn-post')
  if (postBtn) postBtn.onclick = async () => {
    const body = $('#post-body').value.trim()
    if (body.length < 2) { toast('内容太短了', 'warn'); return }
    postBtn.disabled = true
    try {
      const r = await api.createPost({ title: $('#post-title').value.trim(), body, tag: $('#post-tag').value })
      toast('已发布', 'ok')
      location.href = '/community?id=' + r.post.id
    } catch (e) { toast(e.message, 'err'); postBtn.disabled = false }
  }

  $$('[data-like]').forEach(btn => {
    btn.onclick = async () => {
      if (!user) { location.href = '/login?next=/community'; return }
      try {
        const r = await api.like(btn.dataset.like)
        btn.classList.toggle('liked', r.liked)
        btn.querySelector('span').textContent = r.likeCount
      } catch (e) { toast(e.message, 'err') }
    }
  })

  renderAside()
}

async function renderAside() {
  let contributors = []
  try { contributors = (await api.contributors()).items } catch (_) {}
  $('#aside').innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:12px">社区规则</h3>
      <div class="small muted" style="line-height:1.9">
        · 就事论事，讨论条文与医案，不评价具体病人。<br>
        · 认证医生的发言带 <span class="badge badge-verified">✓ 已认证医生</span> 徽标。<br>
        · 线上讨论不能替代面诊。
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px">条文贡献者</h3>
      ${contributors.length ? contributors.slice(0, 5).map(c => `
        <div class="row" style="padding:6px 0">
          ${avatar({ displayName: c.display_name, role: c.role, verified: c.verified }, 'avatar-sm')}
          <div style="flex:1;min-width:0">
            <div class="small" style="font-weight:700">${esc(c.display_name)}</div>
            <div class="tiny dim">${c.nodes} 条 · ${c.fields} 字段</div>
          </div>
        </div>`).join('') : '<div class="small muted">暂无</div>'}
    </div>`
}
