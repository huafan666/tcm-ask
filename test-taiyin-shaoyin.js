// test-taiyin-shaoyin.js — 太阴+少阴篇新方判别测试
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
const mk = () => new Engine(registry)

console.log('\n[1] 桂枝加芍药汤: 腹胀满+腹时痛 → 成立, 桂枝加大黄不成立')
{
  const e = mk()
  e.setDirect('abdominal_fullness', 'yes')
  e.setDirect('abdominal_pain', 'yes')
  e.setDirect('severe_abdominal_pain', 'no')
  check('桂枝加芍药成立', e.state['guizhi_jia_shaoyao_tang'] === 'yes', `=${e.state['guizhi_jia_shaoyao_tang']}`)
  check('桂枝加大黄不成立(无大实痛)', e.state['guizhi_jia_dahuang_tang'] !== 'yes', `=${e.state['guizhi_jia_dahuang_tang']}`)
}

console.log('\n[2] 桂枝加大黄汤: 腹胀满+大实痛 → 成立')
{
  const e = mk()
  e.setDirect('abdominal_fullness', 'yes')
  e.setDirect('severe_abdominal_pain', 'yes')
  check('桂枝加大黄成立', e.state['guizhi_jia_dahuang_tang'] === 'yes', `=${e.state['guizhi_jia_dahuang_tang']}`)
  check('桂枝加芍药不成立(无时痛)', e.state['guizhi_jia_shaoyao_tang'] !== 'yes', `=${e.state['guizhi_jia_shaoyao_tang']}`)
}

console.log('\n[3] 黄连阿胶汤: 心烦+不得卧 → 成立')
{
  const e = mk()
  e.setDirect('restless', 'yes')
  e.setDirect('vex_insomnia', 'yes')
  e.setDirect('cold_aversion', 'no')
  check('黄连阿胶成立', e.state['huanglian_ajiao_tang'] === 'yes', `=${e.state['huanglian_ajiao_tang']}`)
}

console.log('\n[4] 附子汤: 身体痛+手足逆冷+少阴 → 成立')
{
  const e = mk()
  e.setDirect('body_pain', 'yes')
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('shaoyin', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('附子汤成立', e.state['fuzi_tang'] === 'yes', `=${e.state['fuzi_tang']}`)
  check('四逆散不成立(非咳悸腹痛)', e.state['sini_san'] !== 'yes', `=${e.state['sini_san']}`)
}

console.log('\n[5] 桃花汤: 下利+便脓血 → 成立')
{
  const e = mk()
  e.setDirect('diarrhea', 'yes')
  e.setDirect('blood_pus_stool', 'yes')
  check('桃花汤成立', e.state['taohua_tang'] === 'yes', `=${e.state['taohua_tang']}`)
}

console.log('\n[6] 猪肤汤: 下利+咽痛+心烦 → 成立')
{
  const e = mk()
  e.setDirect('diarrhea', 'yes')
  e.setDirect('throat_pain', 'yes')
  e.setDirect('restless', 'yes')
  e.setDirect('cold_aversion', 'no')
  check('猪肤汤成立', e.state['zhufu_tang'] === 'yes', `=${e.state['zhufu_tang']}`)
  check('甘草/桔梗不成立(有下利)', e.state['gancao_tang'] !== 'yes', `=${e.state['gancao_tang']}`)
}

console.log('\n[7] 甘草汤/桔梗汤: 单纯咽痛(无下利) → 成立')
{
  const e = mk()
  e.setDirect('throat_pain', 'yes')
  e.setDirect('diarrhea', 'no')
  check('甘草汤成立', e.state['gancao_tang'] === 'yes', `=${e.state['gancao_tang']}`)
  check('桔梗汤成立', e.state['jiegeng_tang'] === 'yes', `=${e.state['jiegeng_tang']}`)
  check('猪肤汤不成立(无下利)', e.state['zhufu_tang'] !== 'yes', `=${e.state['zhufu_tang']}`)
}

console.log('\n[8] 苦酒汤: 咽中生疮+语言难出 → 成立')
{
  const e = mk()
  e.setDirect('throat_ulcer', 'yes')
  e.setDirect('speech_difficulty', 'yes')
  check('苦酒汤成立', e.state['kujiu_tang'] === 'yes', `=${e.state['kujiu_tang']}`)
}

console.log('\n[9] 白通汤: 下利+少阴+恶寒 → 成立')
{
  const e = mk()
  e.setDirect('diarrhea', 'yes')
  e.setDirect('shaoyin', 'yes')
  e.setDirect('cold_aversion', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('白通汤成立', e.state['baitong_tang'] === 'yes', `=${e.state['baitong_tang']}`)
}

console.log('\n[10] 通脉四逆汤: 下利清谷+里寒外热+手足逆冷 → 成立')
{
  const e = mk()
  e.setDirect('clear_grain_diarrhea', 'yes')
  e.setDirect('inner_cold_outer_heat', 'yes')
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('通脉四逆成立', e.state['tongmai_sini_tang'] === 'yes', `=${e.state['tongmai_sini_tang']}`)
}

console.log('\n[11] 四逆散: 手足逆冷+心悸 → 成立')
{
  const e = mk()
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('heart_palp', 'yes')
  check('四逆散成立', e.state['sini_san'] === 'yes', `=${e.state['sini_san']}`)
}

console.log('\n[12] 插件加载 & 总量')
{
  const byKind = {}
  Object.values(registry).forEach(p => byKind[p.kind] = (byKind[p.kind]||0) + 1)
  console.log('  total', Object.keys(registry).length, JSON.stringify(byKind))
  check('formula>80', byKind.formula > 80)
}

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
process.exit(fail ? 1 : 0)
