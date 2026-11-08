'use strict'
// run-case.js
// 把一段医案/口语直接喂进引擎，看看现在能推出什么——整理三元组时的即时验证工具。
//
//   node run-case.js "患者王某，男，35岁。恶寒发热，全身疼痛，无汗，咳嗽，无腹泻，脉浮紧。"
//   node run-case.js -f mahuang_tang "无汗，怕冷，口不渴"      # 只看某个节点的路径逐条判定
//   node run-case.js                                          # 从标准输入读

const path = require('path')
const { loadAll } = require('./core/loader')
const { Engine } = require('./engine/engine')
const { Asker } = require('./engine/asker')

const argv = process.argv.slice(2)
let focus = null
const words = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-f' || argv[i] === '--formula') { focus = argv[++i]; continue }
  words.push(argv[i])
}

function readStdin() {
  return new Promise(resolve => {
    let d = ''
    if (process.stdin.isTTY) return resolve('')
    process.stdin.on('data', c => { d += c })
    process.stdin.on('end', () => resolve(d))
    setTimeout(() => resolve(d), 300)
  })
}

;(async () => {
  const text = (words.join(' ') || (await readStdin()) || '').trim()
  if (!text) {
    console.log('用法: node run-case.js "医案文字" [-f 节点名]')
    process.exit(1)
  }

  const { registry, byKind } = loadAll(path.join(__dirname, 'plugins'))
  const e = new Engine(registry)
  e.feed(text)

  console.log('\n输入：' + text)
  console.log('条文库：' + Object.keys(registry).length + ' 个节点')

  const yes = [], no = []
  for (const n of Object.keys(e.state)) {
    if (e.state[n] === 'yes') yes.push(registry[n].title + ' (' + n + ')')
    else if (e.state[n] === 'no') no.push(registry[n].title + ' (' + n + ')')
  }
  console.log('\n【命中 yes】' + (yes.length ? '' : ' 无'))
  yes.forEach(x => console.log('  ✓ ' + x))
  console.log('\n【明确 no】' + (no.length ? '' : ' 无'))
  no.forEach(x => console.log('  ✗ ' + x))

  const asker = new Asker(e)
  const cands = asker.candidates()
  const q = asker.nextQuestion()
  console.log('\n【候选方剂】' + cands.length + ' 个')
  if (q) console.log('【下一个反问】' + q.title + ' → ' + q.phrase)

  const show = focus ? [focus] : cands.slice(0, 6)
  if (show.length) {
    console.log('\n【路径逐条判定】')
    for (const name of show) {
      const def = registry[name]
      if (!def || !def.needs || !def.needs.length) continue
      const paths = Array.isArray(def.needs[0]) ? def.needs : [def.needs]
      console.log('\n  ' + def.title + ' (' + name + ') → ' + (e.state[name] || 'unknown'))
      paths.forEach((p, i) => {
        const cells = p.map(c => {
          const v = e.evalCond(c)
          return c + '=' + (v === true ? '满足' : v === false ? '不满足' : '未知')
        })
        console.log('   三元组' + (i + 1) + ': ' + cells.join('  '))
      })
    }
  }
  console.log('')
})()
