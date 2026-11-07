// core/loader.js
// 加载器：扫描 plugins/ 下四个子目录，把每个 .js 文件变成一个可推理的对象插件。
// 支持热装载：watchPlugins() 监听目录，新增/改动/删除 js 文件后自动重载所有插件。

const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

const DIRS = ['symptoms', 'pulses', 'syndromes', 'formulas']

function loadAll(pluginsRoot) {
  const registry = {}   // name -> 插件对象（只读定义）
  const byKind = {}

  for (const dir of DIRS) {
    const full = path.join(pluginsRoot, dir)
    if (!fs.existsSync(full)) continue
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith('.js')) continue
      const abs = path.join(full, file)
      try {
        // 清缓存，确保改了文件能被重新读取
        try { delete require.cache[require.resolve(abs)] } catch (e) {}
        const mod = require(abs)
        if (!mod || !mod.name || !mod.title) {
          // 空文件或写到一半的草稿：安静跳过，写完补齐字段后会自动被识别
          console.log(`[loader] 跳过草稿(缺 name/title): ${file}`)
          continue
        }
        if (registry[mod.name]) {
          throw new Error(`name 重复: ${mod.name} (${file} 与已有冲突)`)
        }
        mod.kind = mod.kind || 'symptom'
        mod.file = file
        mod.dir = dir
        mod.needs = mod.needs || []
        registry[mod.name] = mod
        ;(byKind[mod.kind] = byKind[mod.kind] || []).push(mod.name)
      } catch (e) {
        console.error(`[loader] 加载失败 ${file}: ${e.message}`)
      }
    }
  }

  return { registry, byKind, all: Object.values(registry) }
}

// 监听 plugins 目录，变化时重载并触发 'change'
function watchPlugins(pluginsRoot, loadFn) {
  const em = new EventEmitter()
  let timer = null
  let watching = false

  function schedule() {
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      go()
    }, 300)
  }

  function go() {
    const next = loadFn(pluginsRoot)
    em.emit('change', next)
  }

  function ensureWatching() {
    if (watching) return
    try {
      for (const dir of DIRS) {
        const full = path.join(pluginsRoot, dir)
        if (!fs.existsSync(full)) continue
        fs.watch(full, (eventType, filename) => {
          if (filename && filename.endsWith('.js')) schedule()
        })
      }
      watching = true
      em.emit('ready')
    } catch (e) {
      console.error('[watch] 监听失败:', e.message)
    }
  }

  ensureWatching()
  return em
}

module.exports = { loadAll, watchPlugins, DIRS }
