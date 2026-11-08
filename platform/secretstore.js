'use strict'
// platform/secretstore.js
// ============================================================
// 把用户自己填的 API Key 加密后再落库（AES-256-GCM）
//
//   · 主密钥来源：环境变量 PLATFORM_SECRET（64 位十六进制 = 32 字节）
//     没有就自动生成一份 platform/data/master.key（gitignore，只在本机）
//   · 密文格式：v1.<base64(iv[12] | tag[16] | ciphertext)>
//   · 数据库里永远没有明文；解不开（换过主密钥）就当作「没配置」，不炸服务
// ============================================================

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const DATA_DIR = process.env.PLATFORM_DATA_DIR || path.join(__dirname, 'data')
const KEY_FILE = process.env.PLATFORM_SECRET_FILE || path.join(DATA_DIR, 'master.key')

let cached = null

function masterKey() {
  if (cached) return cached

  const fromEnv = process.env.PLATFORM_SECRET
  if (fromEnv) {
    const buf = /^[0-9a-fA-F]{64}$/.test(fromEnv.trim())
      ? Buffer.from(fromEnv.trim(), 'hex')
      : Buffer.from(fromEnv.trim(), 'base64')
    if (buf.length === 32) { cached = buf; return cached }
    console.warn('[secretstore] PLATFORM_SECRET 不是 32 字节，忽略，改用本地密钥文件')
  }

  try {
    if (fs.existsSync(KEY_FILE)) {
      const buf = Buffer.from(fs.readFileSync(KEY_FILE, 'utf8').trim(), 'hex')
      if (buf.length === 32) { cached = buf; return cached }
    }
  } catch (_) {}

  fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true })
  const fresh = crypto.randomBytes(32)
  fs.writeFileSync(KEY_FILE, fresh.toString('hex'), { mode: 0o600 })
  cached = fresh
  return cached
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey(), iv)
  const body = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return 'v1.' + Buffer.concat([iv, tag, body]).toString('base64')
}

/** 解不开返回 null（不抛异常：换过主密钥的用户会退化成「未配置」） */
function decrypt(payload) {
  if (!payload || typeof payload !== 'string' || !payload.startsWith('v1.')) return null
  try {
    const raw = Buffer.from(payload.slice(3), 'base64')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const body = raw.subarray(28)
    const d = crypto.createDecipheriv('aes-256-gcm', masterKey(), iv)
    d.setAuthTag(tag)
    return Buffer.concat([d.update(body), d.final()]).toString('utf8')
  } catch (_) {
    return null
  }
}

module.exports = { encrypt, decrypt, KEY_FILE }
