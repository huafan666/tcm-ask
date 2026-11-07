// test-undo.js — 撤回(undo)功能测试
// 验证: 每次问答前快照, 输入撤回命令可弹栈还原 engine.state / asker.asked
const path = require('path')
const { loadAll } = require('./core/loader.js')
const { Engine } = require('./engine/engine.js')
const { Asker } = require('./engine/asker.js')

const root = path.resolve('plugins')
const { registry } = loadAll(root)
let pass = 0, fail = 0
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ✓', label) }
  else { fail++; console.log('  ✗', label, detail || '') }
}

// 复刻 run-mvp.js 的撤回机制
let snapshotStack = []
function takeSnapshot(engine, asker, pending) {
  snapshotStack.push({
    state: JSON.parse(JSON.stringify(engine.state)),
    asked: new Set(asker.asked),
    pending
  })
  if (snapshotStack.length > 50) snapshotStack.shift()
}
function undo(engine, asker) {
  const s = snapshotStack.pop()
  if (!s) return false
  engine.state = s.state
  asker.asked = s.asked
  return true
}

const mk = () => new Engine(registry)
let e, a

console.log('\n[1] 基础: 快照→改状态→撤回恢复')
{
  e = mk(); a = new Asker(e)
  takeSnapshot(e, a, null)
  e.setDirect('constipation', 'yes')
  check('便秘yes', e.state['constipation'] === 'yes')
  check('能撤回', undo(e, a) === true)
  check('撤回后便秘unknown', e.state['constipation'] === 'unknown')
}

console.log('\n[2] 三步栈: 连续问答逐步回退')
{
  e = mk(); a = new Asker(e)
  takeSnapshot(e, a, null); e.setDirect('constipation', 'yes')
  takeSnapshot(e, a, null); e.setDirect('tidal_fever', 'yes')
  takeSnapshot(e, a, null); a.markAsked('tidal_fever')
  check('asked含tidal_fever', a.asked.has('tidal_fever'))
  check('潮热yes', e.state['tidal_fever'] === 'yes')
  check('撤3→asked清空', undo(e, a) === true && !a.asked.has('tidal_fever'))
  check('撤3后潮热仍yes(上一步)', e.state['tidal_fever'] === 'yes')
  check('撤2→潮热unknown', undo(e, a) === true && e.state['tidal_fever'] === 'unknown')
  check('撤2后便秘仍yes', e.state['constipation'] === 'yes')
  check('撤1→便秘unknown', undo(e, a) === true && e.state['constipation'] === 'unknown')
  check('空栈不可撤', undo(e, a) === false)
}

console.log('\n[3] 撤回后能重新问被skip过的问题')
{
  e = mk(); a = new Asker(e)
  takeSnapshot(e, a, null); a.markAsked('restless')
  check('被skip', a.asked.has('restless'))
  undo(e, a)
  check('撤后不再skip', !a.asked.has('restless'))
}

console.log('\n[4] 快照上限50')
{
  e = mk(); a = new Asker(e)
  for (let i = 0; i < 60; i++) takeSnapshot(e, a, null)
  check('栈被截断到50', snapshotStack.length === 50)
}

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
process.exit(fail ? 1 : 0)
