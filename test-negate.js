'use strict'
// test-negate.js
// 回归测试：医案/口语里的「阴性表述」不能被当成阳性。
// 背景：整理医案时满篇「无汗」「无腹泻」「未见发热」「否认腹痛」，
// 以前只有 negate() 里手写过的词才认得，于是「无腹泻」会让下利=yes，
// 进而误点亮葛根汤/小青龙汤这类依赖下利的方子。

const path = require('path')
const { loadAll } = require('./core/loader')
const { Engine } = require('./engine/engine')

const { registry } = loadAll(path.join(__dirname, 'plugins'))

let pass = 0, fail = 0
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name) }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')) }
}

function stateOf(text, name) {
  const e = new Engine(registry)
  e.feed(text)
  return e.state[name]
}

console.log('=== 1. 阴性表述必须判 no ===')
check('无腹泻 → 下利 no', stateOf('无腹泻', 'diarrhea') === 'no', stateOf('无腹泻', 'diarrhea'))
check('没有腹泻 → 下利 no', stateOf('没有腹泻', 'diarrhea') === 'no')
check('未见腹泻 → 下利 no', stateOf('未见腹泻', 'diarrhea') === 'no')
check('否认腹泻 → 下利 no', stateOf('否认腹泻', 'diarrhea') === 'no')
check('不汗出 → 汗出 no', stateOf('不汗出', 'sweat') === 'no', stateOf('不汗出', 'sweat'))
check('没有汗 → 汗出 no', stateOf('没有汗', 'sweat') === 'no')
check('无口渴 → 口渴 no', stateOf('无口渴', 'thirsty') === 'no', stateOf('无口渴', 'thirsty'))
check('不渴 → 口渴 no', stateOf('不渴', 'thirsty') === 'no')
check('未见发热 → 发热 no', stateOf('未见发热', 'fever') === 'no')
check('不怕冷 → 恶寒 no', stateOf('不怕冷', 'cold_aversion') === 'no')
check('无明显口干 → 口渴 no', stateOf('无明显口干', 'thirsty') === 'no', stateOf('无明显口干', 'thirsty'))
check('无气喘 → 喘 no（短词「喘」不能漏出来）', stateOf('无气喘', 'chuan') === 'no', stateOf('无气喘', 'chuan'))
check('无时腹痛 → 腹痛 no', stateOf('无时腹痛', 'abdominal_pain') === 'no', stateOf('无时腹痛', 'abdominal_pain'))

console.log('\n=== 2. 阳性表述不能被误伤 ===')
check('我怕冷 → 恶寒 yes', stateOf('我怕冷', 'cold_aversion') === 'yes')
check('有点发热 → 发热 yes', stateOf('有点发热', 'fever') === 'yes')
check('无汗 → 无汗 yes', stateOf('无汗', 'no_sweat') === 'yes', stateOf('无汗', 'no_sweat'))
check('咳嗽不止 → 咳 yes', stateOf('咳嗽不止', 'cough') === 'yes', stateOf('咳嗽不止', 'cough'))
check('不断出汗 → 汗出 yes', stateOf('不断出汗', 'sweat') === 'yes', stateOf('不断出汗', 'sweat'))
check('没有明显缓解，仍发热 → 发热 yes', stateOf('没有明显缓解，仍发热', 'fever') === 'yes', stateOf('没有明显缓解，仍发热', 'fever'))
check('两个都没了：无发热，但口渴 → 口渴 yes', stateOf('无发热，但口渴', 'thirsty') === 'yes')

console.log('\n=== 3. 医案整段：麻黄汤案 ===')
{
  const text = '患者王某，男，35岁。昨日受凉后出现恶寒发热，全身疼痛，无汗，咳嗽，无腹泻，精神体力尚可，舌淡红，苔薄白，脉浮紧。'
  const e = new Engine(registry)
  e.feed(text)
  check('下利=n o（无腹泻）', e.state.diarrhea === 'no', e.state.diarrhea)
  check('下利为 no 后，葛根汤不再成立', e.state.gegen_tang !== 'yes', e.state.gegen_tang)
  // 注意：小青龙汤第三条路径是「咳+无汗」，本条医案确实满足它——这是数据里路径偏松，
  // 不是引擎错。整理条文时应当把这条路径收紧（加干呕/不渴）。
  check('小青龙汤=yes（「咳+无汗」路径本就偏松，属已知数据问题）', e.state.xiaoqinglong_tang === 'yes', e.state.xiaoqinglong_tang)
  check('无汗=yes', e.state.no_sweat === 'yes')
  check('汗出=no（汗出者忌桂枝汤/麻黄汤要散）', e.state.sweat === 'no')
  // ⚠ 语义修正（2026-02）：
  //   needs 的多条路径之间是 **OR**，所以「只否掉一部分路径」推不出整个方不成立。
  //   桂枝汤除了「汗出」两条路径，还有「妊娠+呕吐+食少」「产后」等路径，
  //   这些没被问到 → 正确结果是 unknown，不是 no。等问诊把妇科那边也问完才会变 no。
  check('桂枝汤未被点亮（无汗否掉了汗出路径，但妊娠/产后路径未问 → unknown 而非 no）',
    e.state.guizhi_tang !== 'yes', e.state.guizhi_tang)
  // 只有**所有**路径都被明确阻断时，才判 no —— 这才是 or 语义的正确结果
  {
    const e2 = new Engine(registry)
    e2.feed('没有汗，没有怀孕，不是产后')
    check('桂枝汤所有路径都被否 → no（or 语义：¬(A∨B) 才等价于 ¬A∧¬B）',
      e2.state.guizhi_tang === 'no', e2.state.guizhi_tang)
  }
  check('脉浮紧 → 脉浮 yes / 脉紧 yes', e.state.floating_pulse === 'yes' && e.state.tight_pulse === 'yes',
    e.state.floating_pulse + '/' + e.state.tight_pulse)
}

console.log('\n=== 4. 单句混合：一半阴一半阳 ===')
{
  const e = new Engine(registry)
  e.feed('不怕冷，但是发热，没有汗')
  check('恶寒 no', e.state.cold_aversion === 'no', e.state.cold_aversion)
  check('发热 yes', e.state.fever === 'yes', e.state.fever)
  check('无汗 yes', e.state.no_sweat === 'yes', e.state.no_sweat)
}

console.log('\n============================================')
console.log(`结果: ${pass} 通过, ${fail} 失败`)
if (fail) process.exitCode = 1
