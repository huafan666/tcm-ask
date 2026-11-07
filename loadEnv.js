// loadEnv.js
// 极简 .env 加载器：读项目根目录 .env 并入 process.env。
// 若本项目未配置 LLM_KEY，则尝试从相邻的 anoroid-app/.env 借用同 key，
// 这样不必手动复制 key，也能用上 DeepSeek。
const fs = require('node:fs')
const path = require('node:path')

function parseFile(p) {
  if (!fs.existsSync(p)) return {}
  const text = fs.readFileSync(p, 'utf8')
  const result = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key) result[key] = value
  }
  return result
}

function loadEnv() {
  let env = parseFile(path.join(__dirname, '.env'))
  // 借用 anoroid 的 key（如果本项目没有）
  if (!env.LLM_KEY) {
    const sibling = parseFile(path.join(__dirname, '..', 'anoroid-app', '.env'))
    if (sibling.LLM_KEY) {
      env.LLM_KEY = sibling.LLM_KEY
      env._source = 'anoroid-app/.env'
    }
  }
  for (const k of Object.keys(env)) {
    if (process.env[k] === undefined) process.env[k] = env[k]
  }
  return env
}

module.exports = loadEnv()
