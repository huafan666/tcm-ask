// test-mvp.js
// 自动化测试：喂入不同症状组合，断言每个对象推演是否与预期一致。
const path = require('path')
const { loadAll } = require('./core/loader')
const { Engine } = require('./engine/engine')

const { registry } = loadAll(path.join(__dirname, 'plugins'))
let pass = 0, fail = 0

function run(utterance, expect) {
  const e = new Engine(registry)
  e.feed(utterance)
  for (const [name, want] of Object.entries(expect)) {
    const got = e.state[name]
    const ok = got === want
    if (ok) pass++; else { fail++; console.log(`✗ "${utterance}" → ${name}: 期望${want} 实际${got}`) }
  }
  // 未在 expect 里但默认应为 yes 的对象也检查（可选，先跳）
}

console.log('\n=== 条文1: 太阳之为病（颈项强痛+恶寒；脉暂不做）===')
run('病人脉浮，脖子僵硬，恶寒', { neck_stiff_pain: 'yes', cold_aversion: 'yes', taiyang_disease: 'yes' })

console.log('\n=== 条文2: 太阳中风（发热+汗出+恶风+脉缓）===')
run('发热，出汗了，怕风，脉缓', { fever: 'yes', sweat: 'yes', wind_aversion: 'yes', slow_pulse: 'yes', solar_windstrike: 'yes' })

console.log('\n=== 条文2 OR路径A: 太阳+发热+汗出（不靠恶风/脉象）===')
run('脉浮，头项强痛，恶寒，发热，出汗', { solar_windstrike: 'yes' })

console.log('\n=== 条文2缺一证: 太阳中风少"恶风"（两路径都不满足）→ 不成立 ===')
run('发热，出汗，脉缓', { solar_windstrike: 'unknown' })


console.log('\n=== 条文3: 太阳伤寒（恶寒+体痛+呕逆+脉紧；发热可有可无）===')
run('恶寒，身痛，干呕，脉紧', { cold_aversion: 'yes', body_pain: 'yes', vomiting: 'yes', tight_pulse: 'yes', solar_cold: 'yes' })

console.log('\n=== 条文3变体: 带发热也成立 ===')
run('发热，恶寒，全身酸痛，想吐，脉紧', { solar_cold: 'yes' })

console.log('\n=== 条文4: 不传（太阳证+不吐+不躁+脉不数急）===')
run('脉浮，头项强痛，恶寒，不吐，不烦躁，脉静', { no_transmission: 'yes' })

console.log('\n=== 条文4反例: 烦燥数急 → 传（不传 no）===')
run('脉浮，头项强痛，恶寒，烦躁，脉数急', { no_transmission: 'no' })

console.log('\n=== 条文5: 未传阳明少阳（太阳在+无阳明+无少阳）===')
run('脉浮，头项强痛，恶寒，没有阳明，未及少阳', { still_sun: 'yes' })

console.log('\n=== 条文5反例: 见少阳 → 已传，未传阳明少阳 no ===')
run('脉浮，头项强痛，恶寒，口苦，胸胁苦满', { still_sun: 'no' })

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
process.exitCode = fail > 0 ? 1 : 0
