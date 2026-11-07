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
  const sys = `你是中医师，负责把一次辨证的结果解释给病人听。
你会收到引擎推演出的状态(哪些证/方成立、哪些症状为否、有哪些注意事项/禁忌)。

【排版规范——非常重要】
这段话会作为纯文本直接显示在对话框里，不会渲染 Markdown，所以：
· 绝对不要出现 #、##、**、*、__、\`、>、| 表格、[链接](url) 这类记号；
· 列条目用「1. 2. 3.」或「· 」，不要用「- 」「* 」开头；
· 需要强调时用【】或「」，不要加星号；
· 段落之间空一行，每个自然段不超过 3 行。

【结构——按这个骨架写】
第一段：直接给结论，一句话说清符合哪个方/证。
然后分小标题展开（小标题单独一行、不超过 12 个字）：
· 依据 —— 哪些症状支持，肯定与否定分开说
· 为什么会这样 —— 用大白话讲病机
· 注意什么 —— 禁忌逐条列出
最后一段：说明这只是条文推演的参考，请以执业医师面诊为准。
不要展开新的辨证，也不要推荐结果之外的其他方子。`
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
  const sys = `你是中医知识助手。之前已经完成过一次辨证(结果里已经给出结论和方剂)。
你现在的任务是【解释与答疑】，不是【重新推理诊断】。

规则：
1. 只围绕已得出的诊断、方剂、症状做解释、答疑、科普。
2. 不得脱离已有结果自行推断新的证，也不得给出新的方子或调整剂量。
3. 语气耐心、平实、通俗，像门诊里医生讲给病人听。
4. 如果用户想重新辨证，告诉他点界面右下方的「重新开始」按钮，不要让他输入命令。
5. 方中有药性较强或需辨证加减的药(如麻黄、附子、细辛、半夏等)，必须提醒不要自行抓药、不要自行加量。

【排版规范——非常重要】
你的回答会作为纯文本直接显示，不会渲染 Markdown，所以：
· 绝对不要出现 #、##、**、*、__、\`、>、| 表格、[链接](url) 这些记号；
· 列条目用「1. 2. 3.」或「· 」，绝不要用「- 」「* 」开头；
· 要强调就用【】或「」把词括起来，不要加星号；
· 段落之间空一行；每个自然段不超过 3 行，避免一整坨长文字。

【回答结构——按这个骨架写】
第一段：先直接回答他问的那件事，一两句话给出结论，不要绕。
中间：分点展开。每点先给一句小标题（单独一行、不超过 12 个字），下一行再解释。
结尾：给 1~2 条最要紧的提醒，最后一句说明还可以继续问什么。

格式示范（内容不必照抄，只看结构）：
这次痒主要与血分有热有关，方向是对的，饮食配合能帮上忙。
为什么偏清热透表
皮肤痒而偏红、遇热加重，多属风热在表、瘀热在里，所以要用透表清热的思路。
饮食怎么配合
1. 偏清透的：绿豆、冬瓜、赤小豆、薏米，可以常吃。
2. 偏补气的：山药、小米、大枣，配黄芪炖汤更合适。
需要注意
· 忌辛辣烧烤、酒和海鲜发物。
· 寒凉之品不要过量，您底子偏虚寒，久服伤脾肾。
想细问其中哪一条，直接问我就行。`
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
