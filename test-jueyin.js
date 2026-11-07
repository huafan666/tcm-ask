// test-jueyin.js — 厥阴篇新方判别测试
const path = require('path')
const { loadAll } = require('./core/loader.js')
const { Engine } = require('./engine/engine.js')

const root = path.resolve('plugins')
const { registry } = loadAll(root)
let pass = 0, fail = 0
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ✓', label) }
  else { fail++; console.log('  ✗', label, detail || '') }
}
const mk = () => new Engine(registry)

console.log('\n[1] 乌梅丸: 吐蛔+时烦 → 成立')
{
  const e = mk()
  e.setDirect('round_worm_vomit', 'yes')
  e.setDirect('restless', 'yes')
  check('乌梅丸成立(蚘厥)', e.state['wumei_wan'] === 'yes', `=${e.state['wumei_wan']}`)
}

console.log('\n[2] 乌梅丸: 久利 → 成立')
{
  const e = mk()
  e.setDirect('chronic_diarrhea', 'yes')
  check('乌梅丸成立(久利)', e.state['wumei_wan'] === 'yes', `=${e.state['wumei_wan']}`)
}

console.log('\n[3] 当归四逆: 手足厥寒+血虚面白 → 成立')
{
  const e = mk()
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('poor_complexion', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('当归四逆成立', e.state['danggui_sini_tang'] === 'yes', `=${e.state['danggui_sini_tang']}`)
}

console.log('\n[4] 当归四逆加吴茱萸生姜: 厥寒+血虚+干呕吐涎沫 → 成立')
{
  const e = mk()
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('poor_complexion', 'yes')
  e.setDirect('vomit_saliva', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('当归四逆加吴茱萸生姜成立', e.state['danggui_sini_jia_wuzhuyu_shengjiang'] === 'yes', `=${e.state['danggui_sini_jia_wuzhuyu_shengjiang']}`)
}

console.log('\n[5] 干姜黄芩黄连人参: 食入口即吐 → 成立')
{
  const e = mk()
  e.setDirect('vomit_on_intake', 'yes')
  check('干姜黄芩黄连人参成立', e.state['ganjiang_huangqin_huanglian_renshen_tang'] === 'yes', `=${e.state['ganjiang_huangqin_huanglian_renshen_tang']}`)
}

console.log('\n[6] 白头翁汤: 下利+里急后重 → 成立; 桃花汤不成立(无脓血)')
{
  const e = mk()
  e.setDirect('diarrhea', 'yes')
  e.setDirect('tenesmus', 'yes')
  check('白头翁成立', e.state['baitouweng_tang'] === 'yes', `=${e.state['baitouweng_tang']}`)
  check('桃花汤不成立(无便脓血)', e.state['taohua_tang'] !== 'yes', `=${e.state['taohua_tang']}`)
}

console.log('\n[7] 吴茱萸汤 厥阴干呕吐涎沫: 干呕+吐涎沫 → 成立')
{
  const e = mk()
  e.setDirect('vomit_saliva', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('吴茱萸成立(干呕吐涎沫)', e.state['wuzhuyu_tang'] === 'yes', `=${e.state['wuzhuyu_tang']}`)
}

console.log('\n[8] 吴茱萸汤 少阴吐利逆冷烦躁:-寒冷+躁+下利 → 成立')
{
  const e = mk()
  e.setDirect('cold_extremities', 'yes')
  e.setDirect('restless', 'yes')
  e.setDirect('diarrhea', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('吴茱萸成立(少阴吐利逆冷)', e.state['wuzhuyu_tang'] === 'yes', `=${e.state['wuzhuyu_tang']}`)
}

console.log('\n[9] 插件加载 & 总量')
{
  const byKind = {}
  Object.values(registry).forEach(p => byKind[p.kind] = (byKind[p.kind]||0) + 1)
  console.log('  total', Object.keys(registry).length, JSON.stringify(byKind))
  check('formula>85', byKind.formula > 85)
}

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
process.exit(fail ? 1 : 0)
