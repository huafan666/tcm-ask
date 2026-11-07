// test-hotreload.js
// 快速验证热装载：加载插件 → 新增一个文件 → 断言 reload 触发且注册表包含新对象。
const path = require('path')
const fs = require('fs')
const { loadAll, watchPlugins, DIRS } = require('./core/loader')

const pluginsRoot = path.join(__dirname, 'plugins')
const targetDir = path.join(pluginsRoot, 'symptoms')

// 新增一个测试插件（勿覆盖已有）
const newFile = path.join(targetDir, 'zz_test_plugin.js')
const content = `module.exports = {\n  name: 'zz_test',\n  title: '测试',\n  kind: 'symptom',\n  trigger(t){ return t.includes('测试') }\n}\n`

let reloaded = false
const em = watchPlugins(pluginsRoot, loadAll)
em.on('change', (next) => {
  if (next.registry['zz_test']) {
    reloaded = true
    console.log('[热装载] 新插件 zz_test 已被识别 ✓')
    // 清理测试文件
    fs.unlinkSync(newFile)
  }
})

// 首次装载含原本对象
const first = loadAll(pluginsRoot)
console.log('首次装载对象数:', Object.keys(first.registry).length)

// 写入新文件触发 watch
setTimeout(() => {
  fs.writeFileSync(newFile, content, 'utf8')
}, 200)

// 稍后检查
setTimeout(() => {
  if (reloaded) {
    console.log('热装载测试: 通过 ✓')
    process.exit(0)
  } else {
    console.error('热装载测试: 失败 ✗（未识别新插件）')
    if (fs.existsSync(newFile)) fs.unlinkSync(newFile)
    process.exit(1)
  }
}, 1200)
