// llm/llmClient.js
// 大模型 HTTP 客户端（DeepSeek 官方 OpenAI 兼容接口）
// 复用 anoroid 的经验：空数组不传 tools；json_object 走 response_format。
// 用最便宜的 deepseek-chat。key 从环境变量 LLM_KEY 读。

function llmConfig() {
  return {
    key: process.env.LLM_KEY || '',
    baseURL: (process.env.LLM_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL || 'deepseek-chat',
    path: process.env.LLM_PATH || '/chat/completions',
    max_tokens: 2000,
  }
}

// 显式给一套配置（平台里每个账号用自己的 key 时走这里，不读环境变量）
function configFrom({ apiKey, baseUrl, model, path: p, maxTokens }) {
  return {
    key: String(apiKey || ''),
    baseURL: (baseUrl || 'https://api.deepseek.com').replace(/\/+$/, ''),
    model: model || 'deepseek-chat',
    path: p || '/chat/completions',
    max_tokens: maxTokens || 2000,
  }
}

async function chatCompletion(cfg, messages, jsonMode = false) {
  const body = { model: cfg.model, messages, max_tokens: cfg.max_tokens }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const resp = await fetch(cfg.baseURL + cfg.path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const t = await resp.text().catch(() => '')
    throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`)
  }
  const data = await resp.json()
  const msg = data.choices && data.choices[0] && data.choices[0].message
  if (!msg) throw new Error('大模型返回异常结构')
  return msg.content || ''
}

module.exports = { llmConfig, configFrom, chatCompletion }
