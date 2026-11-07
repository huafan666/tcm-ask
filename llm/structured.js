// llm/structured.js
// 解析 LLM1 症状整理器输出的三态标记文本【肯定】/【否定】/【模糊】，
// 映射到规则引擎的 yes/no。因为引擎的 feed() 只做子串匹配，LLM 输出的
// "【否定】口渴" 会被 thirsty.trigger 的 "口渴" 子串误判为 yes。
// 这个解析器直接用标题/触发词把每行定位到具体症状对象并设态，稳定可靠。
//
// 用法：applyStructured(engine, registry, llmText)
//   对每一行：
//     【肯定】X   → 把能命中 X 的症状设为 yes
//     【否定】X   → 把能命中 X 的症状设为 no
//     【模糊】X   → 忽略（保持 unknown，交给后续问诊反问）

function _findMatch(text, registry) {
  // 返回 text 命中的第一个症状对象（按 title 或 trigger 词）
  for (const [name, def] of Object.entries(registry)) {
    if (!def.trigger) continue
    // 1) title 精确包含
    if (def.title && text.includes(def.title)) return { name, def }
  }
  // 2) 逐症状 trigger 词匹配（用返回true的第一个）
  for (const [name, def] of Object.entries(registry)) {
    if (!def.trigger) continue
    try { if (def.trigger(text)) return { name, def } } catch (_) {}
  }
  return null
}

// 把一行【肯定】/【否定】句子设到引擎
function _applyLine(engine, registry, tag, rest) {
  const m = _findMatch(rest, registry)
  if (!m) return 0
  if (tag === '肯定') engine.setDirect(m.name, 'yes')
  else if (tag === '否定') engine.setDirect(m.name, 'no')
  else return 0   // 模糊 → 不动
  return 1
}

function applyStructured(engine, registry, text) {
  if (!text || typeof text !== 'string') return
  const lines = text.split(/\r?\n/)
  let applied = 0
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.includes('【肯定】')) {
      applied += _applyLine(engine, registry, '肯定', t.replace('【肯定】', '').trim())
    } else if (t.includes('【否定】')) {
      applied += _applyLine(engine, registry, '否定', t.replace('【否定】', '').trim())
    } else if (t.includes('【模糊】')) {
      _applyLine(engine, registry, '模糊', t.replace('【模糊】', '').trim())
    }
  }
  return applied
}

module.exports = { applyStructured }
