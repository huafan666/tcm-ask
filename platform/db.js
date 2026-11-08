'use strict'
// platform/db.js
// ============================================================
// 云平台的持久层：Node 24 内置 node:sqlite（仍然零依赖、单文件数据库）
//
//   · 一个文件 platform/data/platform.db，随仓库/镜像一起搬走
//   · 打开 WAL，允许并发读 + 串行写
//   · 建表用 CREATE TABLE IF NOT EXISTS，老库自动补齐（本 demo 不需要迁移框架）
// ============================================================

const fs = require('node:fs')
const path = require('node:path')

// node:sqlite 在 24.x 仍会打印 ExperimentalWarning，这里只吞掉这一条，其它警告照常
const origEmitWarning = process.emitWarning
process.emitWarning = function (warning, ...rest) {
  const text = typeof warning === 'string' ? warning : (warning && warning.message) || ''
  if (text.includes('SQLite is an experimental feature')) return
  return origEmitWarning.call(process, warning, ...rest)
}

const { DatabaseSync } = require('node:sqlite')

const DATA_DIR = process.env.PLATFORM_DATA_DIR || path.join(__dirname, 'data')
const DB_PATH = process.env.PLATFORM_DB || path.join(DATA_DIR, 'platform.db')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  display_name  TEXT    NOT NULL,
  role          TEXT    NOT NULL,              -- patient | doctor | admin
  status        TEXT    NOT NULL DEFAULT 'active',  -- active | pending | blocked
  password_hash TEXT    NOT NULL,
  bio           TEXT    NOT NULL DEFAULT '',
  specialty     TEXT    NOT NULL DEFAULT '',   -- 医生的科室/专长
  verified      INTEGER NOT NULL DEFAULT 0,    -- 医生认证徽标
  created_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- 每个账号自己的大模型 API 配置（明文 key 不落库，这里只存 AES-256-GCM 密文）
CREATE TABLE IF NOT EXISTS user_api_keys (
  user_id    INTEGER PRIMARY KEY,
  provider   TEXT    NOT NULL DEFAULT 'deepseek',
  base_url   TEXT    NOT NULL,
  model      TEXT    NOT NULL,
  key_cipher TEXT    NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

-- 一次完成的问诊（患者档案）
CREATE TABLE IF NOT EXISTS consults (
  id          TEXT PRIMARY KEY,
  user_id     INTEGER,
  input_text  TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',
  result_json TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- 医生提交的条文草稿（payload 就是 dev 画布 /api/save 的载荷）
CREATE TABLE IF NOT EXISTS drafts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id   INTEGER NOT NULL,
  title       TEXT    NOT NULL DEFAULT '',
  summary     TEXT    NOT NULL DEFAULT '',
  payload     TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewer_id INTEGER,
  review_note TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL,
  reviewed_at TEXT
);

-- 字段级条文归属：某个节点某个字段是谁提供的（审核通过时登记）
CREATE TABLE IF NOT EXISTS attributions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  node_name  TEXT    NOT NULL,
  field      TEXT    NOT NULL,   -- node | title | trigger | negate | ask | needs | contraindications
  author_id  INTEGER NOT NULL,
  draft_id   INTEGER,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attr_node ON attributions(node_name);

CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id  INTEGER NOT NULL,
  title      TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL,
  tag        TEXT    NOT NULL DEFAULT '讨论',
  created_at TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  author_id  INTEGER NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comment_post ON comments(post_id);

CREATE TABLE IF NOT EXISTS likes (
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TEXT    NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
`

let db = null

function open() {
  if (db) return db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}

// 极简查询封装：q.all / q.get / q.run
const q = {
  all(sql, ...params) {
    return open().prepare(sql).all(...params)
  },
  get(sql, ...params) {
    return open().prepare(sql).get(...params) || null
  },
  run(sql, ...params) {
    return open().prepare(sql).run(...params)
  },
  exec(sql) {
    return open().exec(sql)
  }
}

const now = () => new Date().toISOString()

module.exports = { q, open, now, DB_PATH, DATA_DIR }
