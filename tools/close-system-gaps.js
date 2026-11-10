'use strict'
// tools/close-system-gaps.js
// 用户提议：单症状方剂应该能被粗筛排除 —— 只要它的条件落在某个系统里。
//
// 实测验证：12 个系统全答「没有」时，250 个方剂只活下来 4 个。
// 那 4 个的条件（气上冲 / 下坠 / 悬饮 / 虫积）不在任何系统里 —— 真·漏网。
//
// 本工具做两件事：
//  A. 把能按语义归到现有「维度分组」的症状补进去
//  B. 语义上无法归入分组、但必须被系统管住的（如「无汗」「恶心」原本被刻意排除在动作组之外），
//     用系统的 extra 字段显式挂上
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')

const WRITE = process.argv.includes('--write')

// A. 归进现有维度分组
const GROUP_ADD = [
  {
    group: 'cough_any',
    add: ['cough_pleuritic_pain', 'foul_pus_sputum', 'hemoptysis', 'throat_rales'],
    why: '都是咳嗽/呼吸相关的具体表现，原先漏在系统外'
  },
  { group: 'hypochondrium_any', add: ['danjieshidianyatong'], why: '胆结石点压痛在右胁' },
  { group: 'limb_any', add: ['jiao_qi_pain'], why: '脚气腿脚疼痛属肢体' },
  { group: 'abdomen_any', add: ['chongji', 'wei_tong'], why: '虫积与胃痛都在腹部' },
  { group: 'edema_any', add: ['wocanminxian'], why: '卧蚕明显＝眼泡浮肿' },
  { group: 'gyneco_any', add: ['blood_clot_dark'], why: '出血色黑多用于妇科漏下' }
]

// B. 用系统 extra 挂上（不进任何维度分组，因为语义上被刻意区分过）
const SYSTEM_EXTRA = {
  sys_chest_abdomen: {
    add: ['nausea', 'qi_surge', 'xiazhui'],
    why: '恶心（不是呕吐动作）、气上冲、下坠感——都在胸腹这块，但刻意不进「呕吐族」等动作分组'
  },
  sys_sweat: {
    add: ['no_sweat'],
    why: '「无汗」与「出汗」相反，刻意不进 sweat_any；但出汗这一问必须能把它判否'
  },
  sys_cold_heat: {
    add: ['pseudo_cold_heat'],
    why: '似冷非冷似热非热属寒热范畴，但它不是具体寒热症状'
  },
  sys_diet: {
    add: ['thirst_rinse_only', 'cold_drink_desire'],
    why: '口干只想漱口（瘀血特异）、喜冷饮（饮食偏好）——属饮食一问，但不进具体口渴族'
  },
  sys_head_body: {
    add: ['er_ming'],
    why: '耳鸣属头面，但不成组'
  }
}

function loadGroups() {
  const p = path.join(ROOT, 'data', 'symptom-groups.js')
  delete require.cache[require.resolve(p)]
  return { p, GROUPS: require(p).GROUPS }
}
function loadSystems() {
  const p = path.join(ROOT, 'data', 'symptom-systems.js')
  delete require.cache[require.resolve(p)]
  return { p, SYSTEMS: require(p).SYSTEMS }
}

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(path.join(ROOT, 'plugins'))

const errors = []
for (const g of GROUP_ADD) {
  if (!registry[g.group]) errors.push('分组不存在: ' + g.group)
  for (const a of g.add) if (!registry[a]) errors.push('症状不存在: ' + a)
}
for (const [sname, cfg] of Object.entries(SYSTEM_EXTRA)) {
  if (!registry[sname]) errors.push('系统不存在: ' + sname)
  for (const a of cfg.add) if (!registry[a]) errors.push('症状不存在: ' + a)
}
if (errors.length) { console.log('❌ ' + errors.join(' / ')); process.exit(1) }

console.log('=== A. 补进现有维度分组 ===')
for (const g of GROUP_ADD) console.log('  ' + g.group + ' += ' + g.add.join('、') + '   （' + g.why + '）')
console.log('\n=== B. 用系统 extra 挂上 ===')
for (const [s, cfg] of Object.entries(SYSTEM_EXTRA)) console.log('  ' + s + ' += ' + cfg.add.join('、') + '   （' + cfg.why + '）')

if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

// ---- A: 改数据文件里的 children ----
{
  const { p, GROUPS } = loadGroups()
  let src = fs.readFileSync(p, 'utf8')
  for (const g of GROUP_ADD) {
    const def = GROUPS.find(x => x.name === g.group)
    if (!def) { console.log('⚠ 未找到 ' + g.group); continue }
    const missing = g.add.filter(a => !def.children.includes(a))
    if (!missing.length) { console.log('  = ' + g.group + ' 已有'); continue }
    // 在该分组的 children 数组收尾 '】' 前插入：定位 name 到下一个 '},' 之间的 children:[...]
    const start = src.indexOf("name: '" + g.group + "'")
    if (start < 0) { console.log('⚠ 源码里找不到 ' + g.group); continue }
    const chStart = src.indexOf('children: [', start)
    if (chStart < 0) { console.log('⚠ ' + g.group + ' 没有 children'); continue }
    let depth = 0, i = chStart + 'children: ['.length - 1
    for (; i < src.length; i++) {
      if (src[i] === '[') depth++
      else if (src[i] === ']') { depth--; if (depth === 0) break }
    }
    const insert = ', ' + missing.map(x => "'" + x + "'").join(', ')
    src = src.slice(0, i) + insert + src.slice(i)
    console.log('  ~ ' + g.group + ' += ' + missing.join('、'))
  }
  fs.writeFileSync(p, src, 'utf8')
}

// ---- B: 给系统加 extra ----
{
  const { p, SYSTEMS } = loadSystems()
  let src = fs.readFileSync(p, 'utf8')
  for (const [sname, cfg] of Object.entries(SYSTEM_EXTRA)) {
    if (src.includes("name: '" + sname + "'") && new RegExp("name: '" + sname + "'[\\s\\S]{0,600}?extra:").test(src)) {
      console.log('  = ' + sname + ' 已有 extra'); continue
    }
    const start = src.indexOf("name: '" + sname + "'")
    if (start < 0) { console.log('⚠ 源码里找不到 ' + sname); continue }
    const gEnd = src.indexOf(']', src.indexOf('groups: [', start))
    if (gEnd < 0) { console.log('⚠ ' + sname + ' 没有 groups'); continue }
    const insert = ",\n    extra: [" + cfg.add.map(x => "'" + x + "'").join(', ') + ']'
    src = src.slice(0, gEnd + 1) + insert + src.slice(gEnd + 1)
    console.log('  ~ ' + sname + ' extra += ' + cfg.add.join('、'))
  }
  fs.writeFileSync(p, src, 'utf8')
}
console.log('\n完成。下一步：node tools/apply-symptom-groups.js --write 然后重生成系统')
