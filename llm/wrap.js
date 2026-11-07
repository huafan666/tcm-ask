// llm/wrap.js
// 大模型包装层：三次调用，夹在规则引擎前后。
//   1) summarizeSymptoms  入口：原始话 → 整理成结构化症状描述(肯定/否定/模糊)
//   2) explainResult      出口：引擎推演 → 组织成完整解释(病机/病理/禁忌/结论)
//   3) freeChat           自由对话：结束诊断后，只解释、不推理诊断
// 全部用最便宜的 deepseek-chat，做最轻的打包。

const { llmConfig, chatCompletion } = require('./llmClient')

let cfgCache = null
function getCfg() { if (!cfgCache) cfgCache = llmConfig(); return cfgCache }

async function summarizeSymptoms(raw, symptomList = []) {
  const cfg = getCfg()
  const pool = symptomList.length
    ? '\n以下是系统已知的症状清单(只许从这里面选，不要自造症状名)：\n' +
      symptomList.map(s => '· ' + s).join('\n')
    : ''
  const sys = `你是中医问诊的"症状整理器"。用户会用口语描述自己哪里不舒服。
请你把这段话整理成一份标准的症状清单，明确区分三态：
- 【肯定】确有某症状（有 + 症状名）
- 【否定】明确没有某症状（无/不 + 症状名）
- 【模糊】用户没说清或含糊（不清楚是否 + 症状名）
${pool}
只输出整理后的清单（每行一条【肯定】/【否定】/【模糊】），不要诊断、不要给方子、不要自创症状、不要推理。`
  const msgs = [
    { role: 'system', content: sys },
    { role: 'user', content: raw },
  ]
  try {
    return await chatCompletion(cfg, msgs, false)
  } catch (e) {
    console.error('[LLM] 症状整理失败，退回原文:', e.message)
    return raw
  }
}

async function explainResult(resultText) {
  const cfg = getCfg()
  const sys = `你是中医师，负责把一次辨证的结果向用户解释清楚。
你会收到一份引擎推演出的状态(哪些证/方成立、哪些症状为否、有哪些注意事项/禁忌)。
请组织成一份通俗、有条理的解释，包括：
1. 这次认为符合的证/方(结论)
2. 依据哪些症状(肯定/否定分别怎么支持)
3. 病机/病理大致解释(为什么是这个证/方)
4. 禁忌与注意事项(务必列出)
5. 告知用户这只是参考，就医请以执业医师为准
不要展开新的辨证或推荐其它未得到的方子。用自然的中文段落。`
  const msgs = [
    { role: 'system', content: sys },
    { role: 'user', content: resultText },
  ]
  try {
    return await chatCompletion(cfg, msgs, false)
  } catch (e) {
    console.error('[LLM] 解释失败:', e.message)
    return '(解释生成失败，以下是原始推演结果)\n' + resultText
  }
}

async function freeChat(history, userLine) {
  const cfg = getCfg()
  const sys = `你是中医知识助手。之前已经完成过一次辨证(其结果已经给出了结论和方子)。
从现在起你的任务是【解释】，不是【推理诊断】。规则：
- 只能围绕已得出的诊断/方剂/症状做解释、答疑、科普
- 不得脱离已有结果自行推断新的证或给新方子
- 如果用户想重新辨证，请让他输入 /restart 重新启动程序
- 语气耐心、平实、通俗`
  const msgs = [
    { role: 'system', content: sys },
    ...history.slice(-10),
    { role: 'user', content: userLine },
  ]
  try {
    const out = await chatCompletion(cfg, msgs, false)
    return out
  } catch (e) {
    console.error('[LLM] 对话失败:', e.message)
    return '(对话失败，请稍后重试)'
  }
}

module.exports = { summarizeSymptoms, explainResult, freeChat }
