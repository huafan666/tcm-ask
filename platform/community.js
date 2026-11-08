'use strict'
// platform/community.js
// ============================================================
// 社区：帖子 + 评论 + 点赞（医生带「已认证」徽标）
// ============================================================

const { q, now } = require('./db')
const { HttpError } = require('./auth')

const TAGS = ['讨论', '条文', '医案', '求问', '科普']

function authorOf(row) {
  return {
    id: row.author_id,
    displayName: row.author_name,
    role: row.author_role,
    verified: !!row.author_verified,
    specialty: row.author_specialty || ''
  }
}

function listPosts({ tag, keyword, viewerId, limit } = {}) {
  const where = []
  const params = []
  if (tag && tag !== '全部') { where.push('p.tag = ?'); params.push(tag) }
  if (keyword) { where.push('(p.title LIKE ? OR p.body LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`) }
  const rows = q.all(
    `SELECT p.*, u.display_name AS author_name, u.role AS author_role, u.verified AS author_verified,
            u.specialty AS author_specialty,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
       FROM posts p JOIN users u ON u.id = p.author_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.id DESC
       LIMIT ?`,
    ...params, Number(limit || 50)
  )
  return rows.map(r => {
    const liked = viewerId
      ? !!q.get('SELECT 1 AS x FROM likes WHERE post_id = ? AND user_id = ?', r.id, viewerId)
      : false
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      tag: r.tag,
      author: authorOf(r),
      commentCount: r.comment_count,
      likeCount: r.like_count,
      liked,
      createdAt: r.created_at
    }
  })
}

function getPost(id, viewerId) {
  const r = q.get(
    `SELECT p.*, u.display_name AS author_name, u.role AS author_role, u.verified AS author_verified,
            u.specialty AS author_specialty,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
       FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?`, Number(id))
  if (!r) throw new HttpError(404, '帖子不存在')
  const comments = q.all(
    `SELECT c.*, u.display_name AS author_name, u.role AS author_role, u.verified AS author_verified,
            u.specialty AS author_specialty
       FROM comments c JOIN users u ON u.id = c.author_id
      WHERE c.post_id = ? ORDER BY c.id ASC`, r.id)
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    tag: r.tag,
    author: authorOf(r),
    likeCount: r.like_count,
    liked: viewerId ? !!q.get('SELECT 1 AS x FROM likes WHERE post_id = ? AND user_id = ?', r.id, viewerId) : false,
    createdAt: r.created_at,
    comments: comments.map(c => ({
      id: c.id,
      body: c.body,
      author: authorOf(c),
      createdAt: c.created_at
    }))
  }
}

function createPost(user, { title, body, tag }) {
  const text = String(body || '').trim()
  if (text.length < 2) throw new HttpError(400, '内容太短了')
  if (text.length > 8000) throw new HttpError(400, '内容太长了（最多 8000 字）')
  const t = TAGS.includes(tag) ? tag : '讨论'
  const res = q.run('INSERT INTO posts (author_id, title, body, tag, created_at) VALUES (?, ?, ?, ?, ?)',
    user.id, String(title || '').trim().slice(0, 120), text, t, now())
  return getPost(Number(res.lastInsertRowid), user.id)
}

function addComment(user, postId, body) {
  const text = String(body || '').trim()
  if (!text) throw new HttpError(400, '评论不能为空')
  if (text.length > 2000) throw new HttpError(400, '评论太长')
  const post = q.get('SELECT id FROM posts WHERE id = ?', Number(postId))
  if (!post) throw new HttpError(404, '帖子不存在')
  q.run('INSERT INTO comments (post_id, author_id, body, created_at) VALUES (?, ?, ?, ?)',
    post.id, user.id, text, now())
  return getPost(post.id, user.id)
}

function toggleLike(user, postId) {
  const post = q.get('SELECT id FROM posts WHERE id = ?', Number(postId))
  if (!post) throw new HttpError(404, '帖子不存在')
  const has = q.get('SELECT 1 AS x FROM likes WHERE post_id = ? AND user_id = ?', post.id, user.id)
  if (has) q.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', post.id, user.id)
  else q.run('INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)', post.id, user.id, now())
  const count = q.get('SELECT COUNT(*) AS n FROM likes WHERE post_id = ?', post.id).n
  return { liked: !has, likeCount: count }
}

function deletePost(user, postId) {
  const post = q.get('SELECT * FROM posts WHERE id = ?', Number(postId))
  if (!post) throw new HttpError(404, '帖子不存在')
  if (post.author_id !== user.id && user.role !== 'admin') throw new HttpError(403, '只能删除自己的帖子')
  q.run('DELETE FROM comments WHERE post_id = ?', post.id)
  q.run('DELETE FROM likes WHERE post_id = ?', post.id)
  q.run('DELETE FROM posts WHERE id = ?', post.id)
  return { ok: true }
}

module.exports = { TAGS, listPosts, getPost, createPost, addComment, toggleLike, deletePost }
