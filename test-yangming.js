// test-yangming.js — 阳明篇新方判别测试
// 验证: 大承气/小承气/猪苓汤/茵陈蒿/栀子檗皮/麻黄连翘/吴茱萸/麻子仁 判据
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

function makeEngine() {
  return new Engine(registry)
}

// ===== 承气纯热门槛 =====
console.log('\n[1] 大承气: 纯热+身体好+便秘+不放屁+左腹按痛 → 大承气成立')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('poor_complexion', 'no')
  e.setDirect('flatus', 'no')
  e.setDirect('left_abdomen_press_pain', 'yes')
  check('大承气汤成立', e.state['dachengqi_tang'] === 'yes', `实际=${e.state['dachengqi_tang']}`)
  // 「不放屁」只否定掉小承气的一条路径；它还有 213/214 条那两条（多汗/潮热+谵语）没被问到，
  // 所以这里只能断言「没成立」，断言 'no' 会是 OR 语义下不成立的强结论。
  check('小承气未成立(不放屁)', e.state['xiaochengqi_tang'] !== 'yes', `实际=${e.state['xiaochengqi_tang']}`)
}

console.log('\n[2] 大承气: 佐证只命中潮热(无按痛不屁) → 仍成立')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('poor_complexion', 'no')
  e.setDirect('tidal_fever', 'yes')
  check('大承气汤成立(潮热佐证)', e.state['dachengqi_tang'] === 'yes', `实际=${e.state['dachengqi_tang']}`)
}

console.log('\n[2b] 大承气: 佐证譫语单独触发')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('poor_complexion', 'no')
  e.setDirect('delirium', 'yes')
  check('大承气汤成立(譫语佐证)', e.state['dachengqi_tang'] === 'yes', `实际=${e.state['dachengqi_tang']}`)
}

console.log('\n[3] 大承气禁忌输出(含虚证禁用)')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('poor_complexion', 'no')
  e.setDirect('flatus', 'no')
  e.setDirect('left_abdomen_press_pain', 'yes')
  const ci = e.contraindications()
  check('含纯热前提', ci.some(x => x.includes('纯热')))
  check('含虚证禁用', ci.some(x => x.includes('虚证')))
  check('含放屁不宜', ci.some(x => x.includes('佐证') || x.includes('放屁')))
}

console.log('\n[4] 小承气: 纯热+大便硬+放屁 → 小承气成立, 大承气未成')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('flatus', 'yes')
  check('小承气汤成立', e.state['xiaochengqi_tang'] === 'yes', `实际=${e.state['xiaochengqi_tang']}`)
  // 注意：needs 的多条路径是 OR，只否掉「不放屁」那一条推不出整方不成立。
  // 要判 no 必须所有路径都被阻断，所以这里先断言「没有成立」。
  check('大承气未成立(放屁)', e.state['dachengqi_tang'] !== 'yes', `实际=${e.state['dachengqi_tang']}`)
  // 要判 no 必须「所有路径都被阻断」（OR 语义）。把剩下的路径一条条关掉才算数。
  const e2 = makeEngine()
  for (const [n, v] of [['cold_drink_desire', 'yes'], ['cold_aversion', 'no'], ['constipation', 'yes'],
    ['flatus', 'yes'], ['fever', 'no'], ['sweat', 'no'],
    ['poor_complexion', 'no'], ['tidal_fever', 'no'], ['delirium', 'no'], ['left_abdomen_press_pain', 'no'],
    ['kou_jin', 'no'], ['chest_fullness', 'no'], ['limb_spasm', 'no'],
    ['abdominal_fullness', 'no'], ['severe_abdominal_pain', 'no'],
    ['diarrhea', 'no'], ['epigastric_lump_soft', 'no'],
    ['postpartum', 'no'], ['lochia_retention', 'no'],
    // 208 条那条路径（手足濈然汗出 + 大便硬 + 不恶寒）也要一并关掉
    ['shouhan', 'no']]) e2.setDirect(n, v)
  check('所有路径都被阻断 → 大承气判否', e2.state['dachengqi_tang'] === 'no', `实际=${e2.state['dachengqi_tang']}`)
}

console.log('\n[4b] 阳明外证: 身热+汗自出+不恶寒+大便不通+气色不差 → 大承气成立')
{
  // 伤寒 182/208：阳明病外证 = 身热、汗自出、不恶寒反恶热；
  // 配上不大便就是阳明腑实、可议下。以前凑不齐喜冷饮/潮热/谵语/按痛，
  // 这种最典型的阳明腑实反而进不了候选，会漏方。
  const e = makeEngine()
  e.setDirect('fever', 'yes')
  e.setDirect('sweat', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  e.setDirect('poor_complexion', 'no')
  check('大承气汤成立(阳明外证)', e.state['dachengqi_tang'] === 'yes', `实际=${e.state['dachengqi_tang']}`)
}

console.log('\n[5] 虚证(气色差+喜热饮+恶寒) → 承气系均不成立(避免泻下伤身)')
{
  const e = makeEngine()
  e.setDirect('poor_complexion', 'yes')
  e.setDirect('cold_aversion', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  e.setDirect('constipation', 'yes')
  check('大承气不成立', e.state['dachengqi_tang'] !== 'yes', `实际=${e.state['dachengqi_tang']}`)
  check('小承气不成立', e.state['xiaochengqi_tang'] !== 'yes', `实际=${e.state['xiaochengqi_tang']}`)
}

console.log('\n[6] 猪苓汤: 大烦渴+小便难 → 成立')
{
  const e = makeEngine()
  e.setDirect('severe_thirst', 'yes')
  e.setDirect('urination_difficulty', 'yes')
  check('猪苓汤成立', e.state['zhuling_tang'] === 'yes', `实际=${e.state['zhuling_tang']}`)
}

console.log('\n[7] 茵陈蒿汤: 身黄+小便难 → 成立')
{
  const e = makeEngine()
  e.setDirect('jaundice', 'yes')
  e.setDirect('urination_difficulty', 'yes')
  check('茵陈蒿汤成立', e.state['yinchenhao_tang'] === 'yes', `实际=${e.state['yinchenhao_tang']}`)
}

console.log('\n[8] 栀子檗皮汤: 身黄+发热 → 成立')
{
  const e = makeEngine()
  e.setDirect('jaundice', 'yes')
  e.setDirect('fever', 'yes')
  check('栀子檗皮汤成立', e.state['zhizi_bopi_tang'] === 'yes', `实际=${e.state['zhizi_bopi_tang']}`)
}

console.log('\n[9] 麻黄连翘赤小豆: 身黄+无汗 → 成立')
{
  const e = makeEngine()
  e.setDirect('jaundice', 'yes')
  e.setDirect('no_sweat', 'yes')
  check('麻黄连翘赤小豆汤成立', e.state['mahuang_lianqiao_chixiaodou_tang'] === 'yes', `实际=${e.state['mahuang_lianqiao_chixiaodou_tang']}`)
}

console.log('\n[10] 吴茱萸汤: 食谷欲呕 → 成立')
{
  const e = makeEngine()
  e.setDirect('vomit_on_food', 'yes')
  e.setDirect('cold_drink_desire', 'no')
  check('吴茱萸汤成立', e.state['wuzhuyu_tang'] === 'yes', `实际=${e.state['wuzhuyu_tang']}`)
}

console.log('\n[11] 麻子仁丸: 大便硬+小便数(脾约津亏) → 成立')
{
  const e = makeEngine()
  e.setDirect('constipation', 'yes')
  e.setDirect('frequent_urination', 'yes')
  check('麻子仁丸成立', e.state['maziren_wan'] === 'yes', `实际=${e.state['maziren_wan']}`)
  // 脾约不看冷饮: 即使不喜冷饮(津亏非实热)仍属麻子仁丸而非承气
  const e2 = makeEngine()
  e2.setDirect('constipation', 'yes')
  e2.setDirect('frequent_urination', 'yes')
  e2.setDirect('cold_drink_desire', 'no')
  check('麻子仁丸仍成立(不喜冷饮)', e2.state['maziren_wan'] === 'yes', `实际=${e2.state['maziren_wan']}`)
  check('此时大承气不成立', e2.state['dachengqi_tang'] !== 'yes', `实际=${e2.state['dachengqi_tang']}`)
}

console.log('\n[12] 承气候选: 纯热+大便硬后, 放屁/左腹按痛被计入区别')
{
  const e = makeEngine()
  e.setDirect('cold_drink_desire', 'yes')
  e.setDirect('cold_aversion', 'no')
  e.setDirect('constipation', 'yes')
  const asker = new Asker(e)
  const { count } = asker.leafDiscrimination()
  check('放屁被计入区别', count['flatus'] > 0)
  check('左腹按痛被计入区别', count['left_abdomen_press_pain'] > 0)
  console.log('   观察: 潮热依赖数=', count['tidal_fever'], '(承气系不再以潮热判别)')
}

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`)
process.exit(fail ? 1 : 0)
