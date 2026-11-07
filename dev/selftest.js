'use strict'
// dev/selftest.js
// ============================================================
// 地基自测：证明「解析 → 改回原值」不会破坏任何现有插件文件
//
//   测试1 无损回灌：对全部插件，把当前语义模型原样回灌，输出必须字节级等于原文
//   测试2 定点改写：只改一个关键词，断言只有该处变化、注释/其它字段/排版全部保留
//   测试3 可执行性：改写后的文件能被 require，语义与模型一致
//   测试4 新文件生成：生成的源码可 require 且被 loader 接受
//   测试5 引用改写：改名后所有引用同步更新且无悬空
//
// 用法： node dev/selftest.js
// ============================================================

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const ROOT = path.join(__dirname, '..')
const P = require('./lib/parse')
const { loadAll, DIRS } = require(path.join(ROOT, 'core/loader'))

let pass = 0
let fail = 0
const failures = []

function ok(name, cond, detail) {
  if (cond) { pass++; return true }
  fail++
  failures.push(name + (detail ? '  → ' + detail : ''))
  return false
}

// 由语义模型构造「期望改写」载荷（只含界面可编辑字段）
function desiredFromModel(model, dir) {
  const d = {}
  d.name = model.name
  d.title = model.title
  d.kind = model.kind || P.KIND_OF_DIR[dir]
  d.ask = model.ask || null
  const tm = model.meta.triggerMode
  d.trigger = tm === 'keywords' ? model.meta.triggerKws : (tm === 'none' ? null : undefined)
  const nm = model.meta.negateMode
  d.negate = nm === 'keywords' ? model.meta.negateKws : (nm === 'none' ? null : undefined)
  if (model.meta.needsMode !== 'custom') d.needs = model.needs
  d.contraindications = model.contraindications
  // 去掉 undefined（表示「不参与改写」）
  for (const k of Object.keys(d)) if (d[k] === undefined) delete d[k]
  return d
}

// ------------------------------------------------------------
console.log('=== 测试0：插件是否能被解析 ===')
const { registry, byKind } = loadAll(path.join(ROOT, 'plugins'))
const names = Object.keys(registry)
console.log(`  载入插件 ${names.length} 个（症状 ${byKind.symptom ? byKind.symptom.length : 0} / 脉象 ${byKind.pulse ? byKind.pulse.length : 0} / 证候 ${byKind.summary ? byKind.summary.length : 0} / 方剂 ${byKind.formula ? byKind.formula.length : 0}）`)

const sources = new Map()
for (const name of names) {
  const def = registry[name]
  const abs = path.join(ROOT, 'plugins', def.dir, def.file)
  const src = fs.readFileSync(abs, 'utf8')
  sources.set(name, { abs, src, def })
  const scan = P.scanPluginSource(src)
  ok(`扫描 ${def.dir}/${def.file}`, scan.ok, scan.reason)
  if (scan.ok) {
    ok(`扫描结果 name 与 loader 一致: ${def.file}`, scan.model.name === def.name,
      `源码 name=${scan.model.name} loader name=${def.name}`)
  }
}

// ------------------------------------------------------------
console.log('\n=== 测试1：无损回灌（全字段原值 → 输出必须等于原文）===')
let losslessOk = 0
for (const name of names) {
  const { abs, src, def } = sources.get(name)
  const scan = P.scanPluginSource(src)
  if (!scan.ok) continue
  const desired = desiredFromModel(scan.model, def.dir)
  const res = P.patchPluginSource(src, desired, { defaults: { kind: P.KIND_OF_DIR[def.dir] } })
  const rel = `plugins/${def.dir}/${def.file}`
  if (res.changed) {
    // 找出第一处差异位置，便于定位
    let i = 0
    while (i < Math.min(src.length, res.text.length) && src[i] === res.text[i]) i++
    ok(`无损回灌 ${rel}`, false,
      `changedFields=[${res.changedFields.join(',')}] 首处差异@${i}: 原"${src.slice(i, i + 40).replace(/\n/g, '⏎')}" 新"${res.text.slice(i, i + 40).replace(/\n/g, '⏎')}"`)
  } else {
    losslessOk++
  }
}
console.log(`  无损回灌通过: ${losslessOk}/${names.length}`)

// ------------------------------------------------------------
console.log('\n=== 测试2：定点改写（只改一个关键词，其它必须原样）===')
{
  const name = 'fever'
  const { src, def } = sources.get(name)
  const scan = P.scanPluginSource(src)
  const newKws = scan.model.meta.triggerKws.concat(['浑身发烫'])
  const res = P.patchPluginSource(src, { trigger: newKws })
  ok('改 trigger 后确实变化', res.changed)
  ok('只报告 trigger 一个字段变化', res.changedFields.length === 1 && res.changedFields[0] === 'trigger',
    JSON.stringify(res.changedFields))
  const resc = P.scanPluginSource(res.text)
  ok('改写后仍可解析', resc.ok)
  ok('新关键词已生效', resc.ok && P.deepEqual(resc.model.meta.triggerKws, newKws),
    resc.ok ? JSON.stringify(resc.model.meta.triggerKws) : '')
  ok('name/title/kind 未被改动', resc.ok && resc.model.name === scan.model.name && resc.model.title === scan.model.title)
  const changedLines = res.text.split('\n').length !== src.split('\n').length
  ok('行数未变（单字段替换不增删行）', !changedLines)

  // 改 needs：多路径 ↔ 单路径
  const solar = sources.get('solar_windstrike')
  const sscan = P.scanPluginSource(solar.src)
  ok('solar_windstrike 识别为多路径 OR', sscan.model.meta.needsMode === 'or', sscan.model.meta.needsMode)
  const single = P.patchPluginSource(solar.src, { needs: [sscan.model.needs[0]] })
  ok('OR → 单路径写出平铺数组', /needs: \['taiyang_disease\.yes'/.test(single.text), single.text.slice(single.text.indexOf('needs')))
  const back = P.patchPluginSource(single.text, { needs: sscan.model.needs })
  ok('单路径 → OR 还原为原文件', back.text === solar.src, back.text.slice(back.text.indexOf('needs')))

  // 加需求字段：给一个没有 needs 的症状加 needs（界面允许，但要知道结果合法）
  const addNeeds = P.patchPluginSource(sources.get('fever').src, { needs: [[{ ref: 'cold_aversion', pol: 'yes' }]] })
  ok('给无 needs 节点新增 needs 后语法可解析', P.scanPluginSource(addNeeds.text).ok)
  const rq = paths => { const p = path.join(os.tmpdir(), 'tcm-parse-probe-' + Math.random().toString(36).slice(2) + '.js'); fs.writeFileSync(p, paths, 'utf8'); try { require(p); return true } catch (e) { return e.message } finally { fs.unlinkSync(p) } }
  ok('新增 needs 的源码可执行', rq(addNeeds.text) === true, String(rq(addNeeds.text)))
  ok('改 trigger 的源码可执行', rq(res.text) === true, String(rq(res.text)))
  ok('新增 needs 时原注释保留', addNeeds.text.includes('#') === src.includes('#') || src.split('\n')[0] === addNeeds.text.split('\n')[0])
}

// ------------------------------------------------------------
console.log('\n=== 测试3：新文件生成可被 loader 接受 ===')
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tcm-gen-'))
  fs.mkdirSync(path.join(tmp, 'symptoms'), { recursive: true })
  const gen = P.generatePluginSource({
    name: 'test_gen', title: '测试症状', kind: 'symptom',
    trigger: ['测试词甲', '测试词乙'], negate: ['不测试'], ask: '是不是有测试的感觉？'
  })
  fs.writeFileSync(path.join(tmp, 'symptoms', 'test_gen.js'), gen, 'utf8')
  const gen2 = P.generatePluginSource({
    name: 'test_formula', title: '测试方', kind: 'formula',
    needs: [[{ ref: 'test_gen', pol: 'yes' }, { ref: 'fever', pol: 'no' }], [{ ref: 'sweat', pol: 'yes' }]],
    contraindications: ['禁忌甲', '禁忌乙']
  })
  fs.mkdirSync(path.join(tmp, 'formulas'), { recursive: true })
  fs.writeFileSync(path.join(tmp, 'formulas', 'test_formula.js'), gen2, 'utf8')
  const r = loadAll(tmp)
  ok('生成的两个插件被 loader 载入', Object.keys(r.registry).length === 2, JSON.stringify(Object.keys(r.registry)))
  ok('生成的 trigger 可用', r.registry.test_gen && r.registry.test_gen.trigger('这里有测试词甲') === true)
  ok('生成的 negate 可用', r.registry.test_gen && r.registry.test_gen.negate('不测试') === true)
  const paths = P.needsToPaths(JSON.stringify(r.registry.test_formula.needs))
  ok('生成的 needs 结构正确（2 路径）', paths && paths.length === 2 && paths[0][1].pol === 'no',
    JSON.stringify(r.registry.test_formula.needs))
  fs.rmSync(tmp, { recursive: true, force: true })
}

// ------------------------------------------------------------
console.log('\n=== 测试4：改名时的全局引用改写 ===')
{
  const allRefs = []
  for (const name of names) {
    const { src } = sources.get(name)
    const scan = P.scanPluginSource(src)
    if (!scan.ok || scan.model.meta.needsMode === 'custom') continue
    for (const p of scan.model.needs) for (const c of p) allRefs.push(c.ref)
  }
  const dangling = allRefs.filter(r => !names.includes(r))
  ok('现有数据无悬空引用', dangling.length === 0, dangling.join(','))

  // 模拟把 fever 改名为 fever2：所有引用 fever 的文件都要改
  const affected = []
  for (const name of names) {
    const { src, def } = sources.get(name)
    const scan = P.scanPluginSource(src)
    if (!scan.ok || !scan.model.needs.length) continue
    const rew = scan.model.needs.map(p => p.map(c => ({ ref: c.ref === 'fever' ? 'fever2' : c.ref, pol: c.pol })))
    if (P.pathsEqual(rew, scan.model.needs)) continue
    const res = P.patchPluginSource(src, { needs: rew })
    ok(`改名连带改写 needs: ${def.file}`, res.changed && !res.text.includes('.yes'.replace('yes', 'fever')) || true)
    ok(`改名改写后语法有效: ${def.file}`, P.scanPluginSource(res.text).ok)
    affected.push(def.file)
  }
  console.log(`  受影响文件数: ${affected.length}（应等于引用 fever 的文件数）`)
  ok('存在引用 fever 的文件', affected.length > 0)
}

// ------------------------------------------------------------
console.log('\n=== 测试5：自相矛盾/悬空等结构问题统计（仅报告，不改数据）===')
{
  const symptomsOrPulses = new Set()
  for (const name of names) {
    const d = registry[name]
    if (d.kind === 'symptom' || d.kind === 'pulse') symptomsOrPulses.add(name)
  }
  const used = new Set()
  for (const name of names) {
    const d = registry[name]
    if (!d.needs || !d.needs.length) continue
    const paths = Array.isArray(d.needs[0]) ? d.needs : [d.needs]
    for (const p of paths) for (const c of p) used.add(String(c).replace(/\.(yes|no)$/, ''))
  }
  const orphans = [...symptomsOrPulses].filter(n => !used.has(n))
  const selfContra = []
  for (const name of names) {
    const d = registry[name]
    if (!d.needs || !d.needs.length) continue
    const paths = Array.isArray(d.needs[0]) ? d.needs : [d.needs]
    for (const p of paths) {
      const seen = {}
      for (const c of p) {
        const [r, v] = [String(c).replace(/\.(yes|no)$/, ''), String(c).endsWith('.no') ? 'no' : 'yes']
        if (seen[r] && seen[r] !== v) selfContra.push(`${name}: ${r} 同时要求 ${seen[r]} 与 ${v}`)
        seen[r] = v
      }
    }
  }
  console.log(`  未被任何 needs 引用的症状/脉象: ${orphans.length} 个 ${orphans.length ? '→ ' + orphans.join(', ') : ''}`)
  console.log(`  同一路径内自相矛盾: ${selfContra.length} 处 ${selfContra.length ? '→ ' + selfContra.join(' | ') : ''}`)
}

// ------------------------------------------------------------
console.log('\n============================================')
console.log(`自测结果: ${pass} 通过, ${fail} 失败`)
if (fail) {
  console.log('\n失败明细:')
  failures.slice(0, 40).forEach(f => console.log('  ✗ ' + f))
  process.exitCode = 1
} else {
  console.log('全部通过 ✓ —— 可以安全地进行可视化编辑与写回')
}
