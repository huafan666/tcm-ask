// run-mvp.js
// 问诊 CLI，接入大模型包装层（DeepSeek 最便宜模型）+ 反问三选 + 自由对话。
//
// 流程:
//   输入症状(原文) → [LLM1 整理] → 规则引擎推演 + 反问三选(是/否/不知道)
//   → 诊断收敛 → [LLM2 解释] 输出完整病理解释
//   → 进入自由对话模式(LLM3,只解释不推理) → /restart 重新辨证
//
// 用法:
//   node run-mvp.js
const path = require('path')
require('./loadEnv')                 // 载入 .env (含借用 anoroid 的 LLM_KEY)
const readline = require('readline')
const { loadAll, watchPlugins } = require('./core/loader')
const { Engine } = require('./engine/engine')
const { Asker } = require('./engine/asker')
const { summarizeSymptoms, explainResult, freeChat } = require('./llm/wrap')
const { applyStructured } = require('./llm/structured')

const pluginsRoot = path.join(__dirname, 'plugins')

let engine = null
let askerInst = null      // 每次辨证复用同一个，跟踪"已问过(答不知道)"的问题
let pendingQuestion = null
let mode = 'diagnose'   // 'diagnose' | 'chat'
let chatHistory = []
let concluded = false   // 本次辨证是否已收敛并交付结果

// ---------- 引擎相关 ----------
function newEngine(reg) { return new Engine(reg) }

// ---------- 撤回(undo)支持 ----------
// 每次问答"应用答案前"把当前状态压栈；输入撤回命令则弹栈还原，实现"点错了回到上一步"。
let snapshotStack = []   // { state, asked, pending }

function takeSnapshot() {
  snapshotStack.push({
    state: JSON.parse(JSON.stringify(engine.state)),
    asked: new Set(askerInst.asked),
    pending: pendingQuestion
  })
  if (snapshotStack.length > 50) snapshotStack.shift()   // 防爆栈，最多保留50步
}

// 弹栈并还原快照；返回是否成功
function undo() {
  const snap = snapshotStack.pop()
  if (!snap) return false
  engine.state = snap.state
  askerInst.asked = snap.asked
  pendingQuestion = snap.pending
  return true
}

function startEngine(loadResult) {
  engine = newEngine(loadResult.registry)
  askerInst = new Asker(engine)   // 本次辨证的 asker，跟踪已问过的问题
  pendingQuestion = null
  mode = 'diagnose'
  concluded = false
  chatHistory = []
  snapshotStack = []   // 新一次辨证清空撤回栈
  console.log('\n[装载] 中医辨证引擎就绪')
  console.log('————————————————————————')
  console.log('请输入病人的症状描述(口语即可，一句话)')
  console.log('例: 发烧、怕冷、还有点咳嗽、不出汗')
}

let loadResult = loadAll(pluginsRoot)
startEngine(loadResult)

const watcher = watchPlugins(pluginsRoot, loadAll)
watcher.on('change', (next) => {
  console.log(`\n[热装载] 插件变化，重载 ${Object.keys(next.registry).length} 个对象...`)
  loadResult = next
  startEngine(next)
  tick()
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

// ---------- 展示 ----------
function renderState() {
  const lines = ['状态:']
  const names = Object.keys(engine.registry).sort()
  for (const name of names) {
    const s = engine.state[name]
    if (s === 'unknown') continue
    const st = s === 'yes' ? '  ✓ yes' : '  ✗ no '
    lines.push(`${st} ${engine.registry[name].title} (${name})`)
  }
  const contra = engine.contraindications()
  if (contra.length) {
    lines.push('⚠️ 注意事项/禁忌:')
    contra.forEach(c => lines.push(`   - ${c}`))
  }
  return lines.join('\n')
}

// 是否"已可交付结论"：候选唯一、或无候选、或再无事可问(多个候选但已无可问的底层症状，视为歧义交付)
function isResolved() {
  const asker = askerInst
  const c = asker.candidates()
  if (c.length === 0 || c.length === 1) return true       // 唯一或无候选 → 收敛
  const hasQ = !!asker.nextQuestion()
  return !hasQ   // 仍有多个候选但已无可问的区分症状 → 视为歧义收敛(仍交付，标注多解)
}

// ---------- 诊断模式 ----------
async function handleDiagnose(openQuestion, text) {
  const lower = text.replace(/\s+/g, '').toLowerCase()

  // 撤回上一步
  if (['back', 'undo', 'z', '撤回', '撤销', '返回', '回上一步', '上一步'].includes(lower)) {
    if (undo()) {
      console.log('  ↩️ 已撤回上一步')
      console.log(renderState())
      // 恢复后重新展示当前该问的问题
      const asker = askerInst
      const q = asker.nextQuestion()
      const c = asker.candidates()
      pendingQuestion = q
      if (q) {
        console.log(`\n❓ ${q.phrase}`)
        console.log(`   [1]是  [2]否  [3]不知道   （还有 ${c.length} 个候选方）`)
      } else if (c.length === 0) {
        console.log('\n✅ 无更多追问。')
      }
    } else {
      console.log('  ⚠️ 没有可撤回的上一步。')
      // 没有可撤回的就回到当前应问的问题
      const asker = askerInst
      const q = asker.nextQuestion()
      const c = asker.candidates()
      pendingQuestion = q
      if (q) {
        console.log(`\n❓ ${q.phrase}`)
        console.log(`   [1]是  [2]否  [3]不知道   （还有 ${c.length} 个候选方）`)
      } else if (c.length === 0) {
        console.log('\n✅ 无更多追问。')
      }
    }
    return
  }

  // 应用本步答案前，先记录当前状态（可回退）
  takeSnapshot()

  // 处理反问三选（1=是，2=否，3=不知道）
  if (openQuestion) {
    const l2 = text.replace(/\s+/g, '').toLowerCase()
    if (l2 === '1' || l2 === '是' || l2 === 'yes' || l2 === '有') {
      engine.setDirect(openQuestion.leaf, 'yes')
    } else if (l2 === '2' || l2 === '否' || l2 === 'no' || l2 === '没有' || l2 === '无') {
      engine.setDirect(openQuestion.leaf, 'no')
    } else if (l2 === '3' || l2 === '不知道' || l2 === '不清楚' || l2 === '模糊' || l2 === '也许') {
      // 答"不知道"→ 保持 unknown，但标记为"已问过"，下一轮问别的问题
      askerInst.markAsked(openQuestion.leaf)
    } else {
      engine.feed(text)
    }
  } else {
    // 正常描述：先交给大模型整理（对着已知症状清单选），再喂规则引擎
    console.log('  (正在整理症状…)')
    let structured = text
    if (process.env.LLM_KEY) {
      try {
        const pool = Object.values(engine.registry)
          .filter(p => p.kind === 'symptom')
          .map(p => p.title)
        structured = await summarizeSymptoms(text, pool)
      } catch (_) {}
    }
    const llmStructured = typeof structured === 'string' && /【肯定】|【否定】|【模糊】/.test(structured)
    if (llmStructured) {
      applyStructured(engine, engine.registry, structured)
    } else {
      engine.feed(structured)
    }
  }

  console.log(renderState())

  // 检查是否收敛 → 解释并进入对话
  if (!isResolved()) {
    poseQuestion()
    return
  }

  // 已收敛：LLM2 解释
  console.log('\n  辨证收敛，正在生成解释…')
  await poseResult()
  mode = 'chat'
  concluded = true
  console.log('\n[进入自由对话模式] 可继续提问(仅解释)。输入 /restart 重新辨证，quit 退出。')
}

function poseQuestion() {
  const asker = askerInst
  const q = asker.nextQuestion()
  const c = asker.candidates()
  pendingQuestion = q
  if (q) {
    console.log(`\n❓ ${q.phrase}`)
    console.log(`   [1]是  [2]否  [3]不知道   （还有 ${c.length} 个候选方）`)
  } else {
    pendingQuestion = null
    if (c.length > 0) {
      console.log(`\nℹ️ 尚无法区分(${c.length}): ${c.map(n => engine.registry[n].title).join('、')}`)
    } else {
      console.log('\n✅ 无更多追问。')
    }
  }
}

async function poseResult() {
  let resultText = renderState()
  let explanation = resultText
  if (process.env.LLM_KEY) {
    try { explanation = await explainResult(resultText) } catch (_) {}
  }
  console.log('\n———— 辨证结果 ————')
  console.log(explanation)
  console.log('———————————————')
  chatHistory.push({ role: 'system', content: '已完成辨证，结果为：' + resultText })
}

// ---------- 对话模式 ----------
async function handleChat(text) {
  if (process.env.LLM_KEY) {
    chatHistory.push({ role: 'user', content: text })
    const reply = await freeChat(chatHistory, text)
    chatHistory.push({ role: 'assistant', content: reply })
    console.log('\n' + reply)
  } else {
    console.log('\n(未配置 LLM_KEY，仅解释模式不可用。请配置 .env 的 LLM_KEY 后重启。)')
  }
}

// ---------- 主循环 ----------
function tick() {
  if (rl.closed) return
  rl.question(mode === 'diagnose' ? '> ' : '(问) ', async (line) => {
    const t = line.trim()
    if (!t) { tick(); return }

    if (t.toLowerCase() === 'quit' || t === 'exit' || t === 'q') {
      console.log('再见'); process.exit(0)
    }
    if (mode === 'chat' && (t === '/restart' || t.toLowerCase() === 'restart')) {
      console.log('\n== 重新辨证 ==')
      startEngine(loadResult)
      tick()
      return
    }

    try {
      if (mode === 'diagnose') {
        await handleDiagnose(pendingQuestion, t)
      } else {
        await handleChat(t)
      }
    } catch (e) {
      console.error('出错:', e.message)
    }
    console.log('')
    tick()
  })
}
tick()
