'use strict'
// 校验批 2 提案里引用的节点是否真实存在
const path = require('path')
const { loadAll } = require('../core/loader')
const { registry } = loadAll(path.join(__dirname, '..', 'plugins'))

const used = ['body_heavy', 'sweat', 'wind_aversion', 'vomiting', 'thirsty', 'body_ache_stiff',
  'easy_urination', 'joint_pain_rigid', 'urination_difficulty', 'fever', 'floating_pulse', 'cold_aversion']
const fangs = ['guizhi_fuzi_tang', 'qugui_jia_baizhu_tang', 'gancao_fuzi_tang', 'baihu_jia_renshen']
const toCreate = ['fangji_huangqi_tang', 'hard_stool', 'short_breath', 'press_pain_aggravated', 'mild_edema']

console.log('=== 要复用的症状节点 ===')
used.forEach(n => console.log('  ' + (registry[n] ? '✓ ' + n + '（' + registry[n].title + '）' : '✗ 不存在 ' + n)))
console.log('\n=== 要加路径的方剂 ===')
fangs.forEach(n => console.log('  ' + (registry[n] ? '✓ ' + n + '（' + registry[n].title + '）' : '✗ 不存在 ' + n)))
console.log('\n=== 计划新建（现在应该都不存在）===')
toCreate.forEach(n => console.log('  ' + (registry[n] ? '✗ 已存在，方案要改: ' + n : '✓ 可新建 ' + n)))

// 参考：现有 4 个方剂的路径条数，便于判断"加一条路径"的影响
console.log('\n=== 现有路径条数（加路径前）===')
for (const n of fangs) {
  const d = registry[n]
  if (!d) continue
  const paths = Array.isArray(d.needs[0]) ? d.needs : (d.needs && d.needs.length ? [d.needs] : [])
  console.log('  ' + n.padEnd(26) + paths.length + ' 条路径')
}
