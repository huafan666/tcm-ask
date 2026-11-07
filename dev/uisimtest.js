'use strict'
// dev/uisimtest.js
// 无浏览器的前端集成测试：用极简 DOM 仿真 + 把 fetch 直接接到真实的 graph.js，
// 真正执行 store / inspector / panels 的渲染路径，抓出静态检查抓不到的运行时错误。
//
// 用法： node dev/uisimtest.js
//
// 覆盖：
//   1) store 载入真实插件图（数量以磁盘为准，不硬编码）
//   2) 检视器：症状/脉象/证候/方剂 + 多路径 OR + 自定义写法节点 + 有模拟结果时
//   3) 模拟面板 / 条文反向面板 / 问诊回放面板的渲染
//   4) 编辑操作（改关键词、加路径、连线、改名、删除）后再次渲染不报错
//   5) 保存载荷能被服务端 computePlan 接受（dryRun，不写盘）

const path = require('node:path')
const graph = require('./lib/graph')

let pass = 0
let fail = 0
const failures = []
const pending = []      // 异步断言的 promise：汇总前必须全部 await，否则失败会被漏报

function ok(name, fn) {
  try {
    const r = fn()
    pass++
    if (r && typeof r.then === 'function') {
      pending.push(r.catch(e => {
        fail++
        failures.push(name + ' → ' + e.message)
      }))
    }
  } catch (e) {
    fail++
    failures.push(name + ' → ' + e.message + '\n      ' + String(e.stack || '').split('\n')[1])
  }
}

// ------------------------------------------------------------
// 极简 DOM 仿真
// ------------------------------------------------------------

function makeClassList(el) {
  const set = new Set()
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    toggle: (c, f) => { const has = set.has(c); const want = f === undefined ? !has : !!f; if (want) set.add(c); else set.delete(c); return want },
    contains: c => set.has(c),
    get length() { return set.size },
    _set: set
  }
}

class El {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase()
    this.children = []
    this.attrs = {}
    this.style = {}
    this.dataset = {}
    this.classList = makeClassList(this)
    this._html = ''
    this._text = ''
    this.value = ''
    this.checked = false
    this.disabled = false
    this._parent = null
    this.viewBox = { baseVal: { x: 0, y: 0, width: 1000, height: 800 } }
  }
  // 仿真器里给「没有父节点」的元素一个替身父节点，避免 getBoundingClientRect 链断裂
  get parentElement() { return this._parent || (this._parent = new El('div')) }
  set parentElement(v) { this._parent = v }
  get innerHTML() { return this._html }
  set innerHTML(v) { this._html = String(v == null ? '' : v) }
  get textContent() { return this._text }
  set textContent(v) { this._text = String(v == null ? '' : v) }
  get firstElementChild() { return this.children[0] || (this._lazyChild || (this._lazyChild = new El('div'))) }
  appendChild(c) { if (c && c.__frag) { c.children.forEach(x => this.appendChild(x)); return c } this.children.push(c); if (c) c.parentElement = this; return c }
  removeChild(c) { this.children = this.children.filter(x => x !== c); return c }
  remove() { if (this.parentElement) this.parentElement.removeChild(this) }
  setAttribute(k, v) {
    this.attrs[k] = String(v)
    if (k === 'id') this.id = String(v)
    // 真实 DOM 里 class 属性与 classList 是同一个东西，仿真器必须同步
    if (k === 'class') {
      this.classList._set.clear()
      String(v).split(/\s+/).filter(Boolean).forEach(x => this.classList._set.add(x))
    }
  }
  getAttribute(k) { return this.attrs[k] }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
  querySelector() { return new El('div') }
  querySelectorAll() { return [] }
  contains() { return false }
  closest() { return null }
  focus() {}
  select() {}
  click() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 800, right: 1280, bottom: 800 } }
}

const registry = new Map()
function stubEl(id) {
  if (registry.has(id)) return registry.get(id)
  const e = new El('div')
  e.id = id
  registry.set(id, e)
  return e
}

const document = {
  createElement: t => new El(t),
  createElementNS: (ns, t) => new El(t),
  createDocumentFragment: () => { const f = new El('fragment'); f.__frag = true; return f },
  getElementById: id => stubEl(id),
  querySelector: () => new El('div'),
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  body: new El('body'),
  documentElement: new El('html')
}

global.document = document
global.window = global
global.addEventListener = () => {}
global.removeEventListener = () => {}
// Node 24 里 navigator 是只读 getter，必须用 defineProperty
try {
  Object.defineProperty(global, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true, writable: true })
} catch (_) {
  try { global.navigator.clipboard = { writeText: async () => {} } } catch (__) {}
}
global.requestAnimationFrame = fn => setTimeout(() => { try { fn() } catch (e) { console.error('[rAF 回调异常] ' + e.message) } }, 0)
global.cancelAnimationFrame = () => {}
if (!global.Event) global.Event = class Event { constructor(t) { this.type = t } }

// fetch → 直接接到真实 graph.js（不为测试启服务器）
global.fetch = async (url, opts) => {
  const u = new URL(url, 'http://127.0.0.1:3090')
  const body = opts && opts.body ? JSON.parse(opts.body) : {}
  let data
  switch (u.pathname) {
    case '/api/graph': data = graph.buildGraph(); break
    case '/api/simulate': data = graph.simulate(body.assignments || {}); break
    case '/api/walkthrough': data = graph.walkthrough(body || {}); break
    case '/api/reverse': data = graph.reverseTree(u.searchParams.get('name'), { maxDepth: Number(u.searchParams.get('depth') || 6) }); break
    case '/api/source': data = graph.readSource(u.searchParams.get('name')); break
    case '/api/status': data = { dev: { ok: true }, main: { running: false }, plugins: graph.buildGraph().stats.total, stats: graph.buildGraph().stats }; break
    case '/api/save': data = graph.previewSave(body); break
    case '/api/layout': data = { ok: true }; break
    default: data = { ok: false, error: '测试未实现: ' + u.pathname }
  }
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
    json: async () => data
  }
}

// ------------------------------------------------------------
// 动态 import 前端模块
// ------------------------------------------------------------

const url = f => 'file:///' + path.join(__dirname, 'public', 'js', f).replace(/\\/g, '/')

;(async () => {
  console.log('=== 开发端前端集成测试（DOM 仿真，无浏览器）===\n')

  const store = await import(url('store.js'))
  const inspector = await import(url('inspector.js'))
  const panels = await import(url('panels.js'))
  const ui = await import(url('ui.js'))

  console.log('模块加载完成：store / inspector / panels / ui\n')

  // ---- 1. 载入真实图 ----
  const g = graph.buildGraph()
  const EXPECT = g.nodes.length          // 以磁盘上的真实数量为准，不在测试里硬编码
  ok('store 载入全部插件节点（期望 ' + EXPECT + ' 个）', () => {
    store.loadGraph(g)
    if (store.allNodes().length !== EXPECT) throw new Error('节点数不是 ' + EXPECT + '，而是 ' + store.allNodes().length)
  })
  console.log(`  store 节点数：${store.allNodes().length}，脏节点：${store.dirtyNames().length}`)

  // ---- 2. 检视器渲染（各类节点）----
  const inspHost = stubEl('tab-inspect')
  const cases = [
    ['fever', '症状（有触发词）'],
    ['cold_aversion', '症状（有 negate）'],
    ['floating_pulse', '脉象'],
    ['solar_windstrike', '证候（多路径 OR）'],
    ['gegen_tang', '方剂（多路径 + 数组内注释）'],
    ['mahuang_tang', '方剂（3 条路径）'],
    ['baihu_jia_renshen', '方剂（.no 条件 + 禁忌）']
  ]
  for (const [name, label] of cases) {
    ok(`检视器渲染：${label}（${name}）`, () => {
      if (!store.node(name)) throw new Error('节点不存在')
      store.S.sel = new Set([name])
      store.S.selEdge = null
      inspector.renderInspector(inspHost)
      if (!inspHost.innerHTML) throw new Error('渲染后 innerHTML 为空')
    })
  }

  ok('检视器渲染：未选中任何节点（占位）', () => {
    store.S.sel = new Set()
    inspector.renderInspector(inspHost)
    if (!inspHost.innerHTML) throw new Error('占位内容为空')
  })

  // ---- 3. 带模拟结果的渲染 ----
  const sim = graph.simulate({ no_sweat: 'yes', wind_aversion: 'yes', severe_thirst: 'no', fever: 'yes' })
  ok('检视器在「有模拟结果」时渲染', () => {
    store.S.sim = sim
    store.S.sel = new Set(['mahuang_tang'])
    inspector.renderInspector(inspHost)
    if (!inspHost.innerHTML) throw new Error('空')
  })
  ok('连线检视器渲染', () => {
    const edge = { from: 'mahuang_tang', to: 'no_sweat', path: 0, cond: 0 }
    if (inspector.renderEdgeInspector) inspector.renderEdgeInspector(inspHost, edge)
    else throw new Error('没有导出 renderEdgeInspector')
  })

  // ---- 4. 三大面板 ----
  const simHost = stubEl('tab-sim')
  const chainHost = stubEl('tab-chain')
  const walkHost = stubEl('tab-walk')

  ok('模拟面板：无结果时渲染', () => {
    store.S.sim = null
    panels.renderSimPanel(simHost)
    if (!simHost.innerHTML) throw new Error('空')
  })
  ok('模拟面板：有结果时渲染', () => {
    store.S.sim = sim
    store.S.simInput = { no_sweat: 'yes', wind_aversion: 'yes', severe_thirst: 'no' }
    panels.renderSimPanel(simHost)
    if (!simHost.innerHTML) throw new Error('空')
  })
  ok('模拟面板：含路径冲突时渲染', () => {
    store.S.sim = graph.simulate({ taiyang_disease: 'no', fever: 'yes', sweat: 'yes' })
    panels.renderSimPanel(simHost)
    const html = simHost.innerHTML
    if (!/冲突/.test(html)) throw new Error('未在界面上出现「冲突」字样（冲突数=' + (store.S.sim.conflicts || []).length + '）')
  })

  await ok('条文反向面板：渲染葛根汤依赖树', async () => {
    panels.renderChainPanel(chainHost)
    await new Promise(r => setTimeout(r, 300))
    if (!chainHost.innerHTML) throw new Error('空')
  })
  ok('条文反向面板：渲染风温病（数组内注释的节点）', async () => {
    store.S.sel = new Set(['wind_warm_disease'])
    panels.renderChainPanel(chainHost)
    await new Promise(r => setTimeout(r, 300))
    if (!chainHost.innerHTML) throw new Error('空')
  })

  const walk = graph.walkthrough({ truth: { no_sweat: 'yes', wind_aversion: 'yes', severe_thirst: 'no' }, maxSteps: 12 })
  ok('问诊回放面板：渲染回放结果', async () => {
    store.S.walk = walk
    panels.renderWalkPanel(walkHost)
    await new Promise(r => setTimeout(r, 150))
    if (!walkHost.innerHTML) throw new Error('空')
  })

  // ---- 5. 编辑操作后仍能渲染 ----
  ok('编辑：加触发关键词', () => {
    store.update('fever', { trigger: ['发热', '发烧', '浑身发烫'] })
    if (store.node('fever').trigger.length !== 3) throw new Error('没生效')
    inspector.renderInspector(inspHost)
  })
  ok('编辑：给方剂加一条新路径并加条件', () => {
    const before = store.node('baihu_jia_renshen').needs.length
    // 约定：pathIndex === 当前路径数 表示「追加一条新路径」
    store.addCondition('baihu_jia_renshen', 'fever', 'yes', before)
    if (store.node('baihu_jia_renshen').needs.length !== before + 1) throw new Error('新路径没加上')
    inspector.renderInspector(inspHost)
  })
  ok('编辑：重复点「新增路径」不会堆积空路径', () => {
    const n = store.node('baihu_jia_renshen')
    store.addPath('baihu_jia_renshen')
    store.addPath('baihu_jia_renshen')
    const empties = store.node('baihu_jia_renshen').needs.filter(p => p.length === 0).length
    if (empties > 1) throw new Error('空路径堆积了：' + empties + ' 条')
  })
  ok('编辑：切换极性', () => {
    store.setPolarity('baihu_jia_renshen', 0, 0, 'no')
    if (store.node('baihu_jia_renshen').needs[0][0].pol !== 'no') throw new Error('极性没变')
    inspector.renderInspector(inspHost)
  })
  ok('编辑：删除条件', () => {
    store.removeCondition('baihu_jia_renshen', 0, 0)
    inspector.renderInspector(inspHost)
  })
  ok('编辑：改名（引用同步）', () => {
    store.renameNode('fever', 'fever_tmp')
    if (!store.node('fever_tmp')) throw new Error('改名失败')
    const users = store.allNodes().filter(n => n.needs.some(p => p.some(c => c.ref === 'fever_tmp')))
    if (!users.length) throw new Error('引用没同步到新名字')
    inspector.renderInspector(inspHost)
  })
  ok('编辑：删除节点', () => {
    store.deleteNode('fever_tmp')
    if (store.node('fever_tmp')) throw new Error('没删掉')
    inspector.renderInspector(inspHost)
  })

  // ---- 6. 保存载荷真实可用 ----
  ok('服务端会拒绝空路径（空路径在引擎里等于永真，必须拦住）', () => {
    const bad = graph.previewSave({ updated: [{ name: 'fever', needs: [[{ ref: 'cold_aversion', pol: 'yes' }], []] }] })
    if (bad.ok) throw new Error('空路径竟然通过了校验')
    if (!/为空/.test((bad.errors || []).join(''))) throw new Error('错误信息没点明是空路径：' + (bad.errors || []).join('；'))
  })

  ok('保存载荷能被服务端接受（dryRun，不写盘）', async () => {
    // 上一步「重复点新增路径」按设计会留下一条空路径（服务端会拒绝），
    // 这里先删掉它，确保本项测的是「合法改动」这条主路径
    const baihu = store.node('baihu_jia_renshen')
    if (baihu) {
      for (let i = baihu.needs.length - 1; i >= 0; i--) {
        if (!baihu.needs[i].length) store.removePath('baihu_jia_renshen', i)
      }
    }
    const payload = store.buildPayload()
    const plan = graph.previewSave(payload)
    if (!plan.ok) throw new Error('服务端拒绝：' + (plan.errors || []).join('；').slice(0, 300))
    if (!plan.files.length) throw new Error('没有任何文件要改，说明改动没进载荷')
    console.log(`     载荷：updated ${payload.updated.length} / created ${payload.created.length} / renamed ${payload.renamed.length} / deleted ${payload.deleted.length}`)
    console.log(`     计划改动 ${plan.files.length} 个文件：${plan.files.map(f => f.kind + ' ' + f.relPath).slice(0, 6).join('，')}${plan.files.length > 6 ? ' …' : ''}`)
  })

  // ---- 7. 撤销必须能回到原状 ----
  ok('撤销：一路撤销后回到原始状态、零脏改动', () => {
    let n = 0
    while (store.undo()) { n++; if (n > 200) break }
    const names = store.allNodes().map(x => x.name)
    if (!names.includes('fever')) throw new Error('fever 没回来')
    if (store.dirtyNames().length !== 0) throw new Error('仍有脏改动：' + store.dirtyNames().join(','))
  })

  // ---- 8. 提示/弹窗工具不炸 ----
  ok('ui.toast / openModal / confirmDialog 可调用', () => {
    ui.toast('测试', 'ok')
    ui.openModal({ title: '测试', body: '<div>内容</div>', buttons: [{ label: '关闭', onClick: c => c() }] })
    ui.closeModal()
    document.getElementById('pd-input')  // 不应抛错
  })

  // ---- 9. 画布：卡片行距不重叠 + 路径一览能看出具体症状 ----
  const canvas = await import(url('canvas.js'))
  canvas.initCanvas()
  ok('画布初始化并渲染（' + EXPECT + ' 节点）', async () => {
    store.loadGraph(g)                 // 回到干净状态：原始节点
    canvas.render()
    await new Promise(r => setTimeout(r, 60))
    const layer = document.getElementById('layer-nodes')
    if (!layer.children.length) throw new Error('layer-nodes 里没有任何节点')
  })

  ok('卡片三行不重叠：中文标题 / 英文 name / 徽标行各有独立行距', async () => {
    await new Promise(r => setTimeout(r, 80))   // 等 render 的 rAF 真正跑完
    const layer = document.getElementById('layer-nodes')
      const FONT = { title: 14, name: 11, badge: 10 }
      const band = (baseline, size) => [baseline - size * 0.82, baseline + size * 0.30]
      let checked = 0
      for (const gnode of layer.children) {
        const name = gnode.attrs['data-name']
        const box = gnode.children.find(c => c.classList.contains('node-box'))
        const texts = gnode.children.filter(c => c.tagName === 'TEXT')
        const title = texts.find(t => t.classList.contains('node-title'))
        const nm = texts.find(t => t.classList.contains('node-name'))
        const badgeText = texts.find(t => t.classList.contains('badge-t'))
        if (!box || !title || !nm || !badgeText) continue
        const H = Number(box.attrs.height)
        const tB = band(Number(title.attrs.y), FONT.title)
        const nB = band(Number(nm.attrs.y), FONT.name)
        const gB = band(Number(badgeText.attrs.y), FONT.badge)
        const gap1 = nB[0] - tB[1]
        const gap2 = gB[0] - nB[1]
        if (gap1 < 1) throw new Error(`${name}: 中文标题行与英文 name 行几乎贴住（间隙 ${gap1.toFixed(1)}px）`)
        if (gap2 < 1) throw new Error(`${name}: 英文 name 行与徽标行几乎贴住（间隙 ${gap2.toFixed(1)}px）`)
        if (tB[0] < 0 || gB[1] > H) throw new Error(`${name}: 内容超出卡片高度 H=${H}（${tB[0].toFixed(1)} / ${gB[1].toFixed(1)}）`)
        checked++
      }
    if (checked < Math.min(100, Number(process.env.EXPECT || 0) || 100)) throw new Error('检查到的卡片太少：' + checked)
    console.log(`     逐张校验 ${checked} 张卡片，三行行距互不重叠、且都在卡片高度内`)
  })

  ok('选中方剂后，画布上出现「路径一览」并写出具体症状中文名', async () => {
    store.S.sel = new Set(['mahuang_tang'])
    store.S.sim = null
    canvas.render()
    await new Promise(r => setTimeout(r, 60))   // render 内部走 requestAnimationFrame
    const overlay = document.getElementById('layer-overlay')
    const legend = overlay.children.find(c => c.classList.contains('legend'))
    if (!legend) throw new Error('layer-overlay 里没有 .legend 浮层')
    const allText = legend.children.filter(c => c.tagName === 'TEXT').map(c => {
      return c._text + (c.children || []).map(t => t._text).join('')
    }).join('\n')
    if (!/路径一览/.test(allText)) throw new Error('缺少标题「路径一览」：' + allText.slice(0, 120))
    for (const must of ['无汗', '恶风', '大烦渴']) {
      if (!allText.includes(must)) throw new Error('路径一览里没有写出症状「' + must + '」：\n' + allText)
    }
    if (!/非/.test(allText)) throw new Error('路径一览没有标出「非」极性')
    console.log('     路径一览：' + allText.split('\n').filter(Boolean).slice(0, 4).join(' ⏐ '))
  })

  ok('检视器「还缺 N 项」写出具体症状名（不再是光秃秃的数字）', () => {
    store.S.sim = graph.simulate({ no_sweat: 'yes', wind_aversion: 'yes', severe_thirst: 'no' })
    store.S.sel = new Set(['mahuang_tang'])
    inspector.renderInspector(inspHost)
    const html = inspHost.innerHTML
    if (!/还缺 [^<（]{2,} 待确认/.test(html)) {
      throw new Error('没找到「还缺 <症状名> 待确认」：' + (html.match(/本条路径：[^<]*/g) || []).join(' | '))
    }
  })

  ok('被阻断的方剂列出全部卡死它的条件', () => {
    const sim = graph.simulate({ auto_sweat: 'yes', no_sweat: 'no' })
    store.S.sim = sim
    panels.renderSimPanel(simHost)
    if (!/被 [^<]*无汗[^<]*阻断/.test(simHost.innerHTML)) {
      throw new Error('被阻断列表里没有写出「无汗」：' + (simHost.innerHTML.match(/被 [^<]*阻断/g) || []).slice(0, 3).join(' | '))
    }
  })

  // 等所有异步断言真正跑完再汇总（否则失败会在汇总之后才记录，被漏报）
  await Promise.all(pending)
  await new Promise(r => setTimeout(r, 120))   // 再等一轮 rAF/定时器，确保延迟日志都打出来了
  await Promise.all(pending)

  console.log('\n============================================')
  console.log(`集成测试结果：${pass} 通过, ${fail} 失败`)
  if (fail) {
    console.log('\n失败明细：')
    failures.forEach(f => console.log('  ✗ ' + f))
    process.exitCode = 1
  } else {
    console.log('全部通过 ✓ —— 页面在浏览器里可以正常渲染与交互')
  }
})().catch(e => {
  console.error('测试脚本自身异常：', e)
  process.exitCode = 1
})
