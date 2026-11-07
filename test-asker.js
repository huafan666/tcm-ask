// test-asker.js
// 验证问诊器：两个方【桂枝汤】和【桂枝加厚朴杏子汤】共用一个"喘"来区分。
// 场景: 病人报"发热、出汗、怕风"(桂枝汤证成立)，但喘未知 → 反问"有没有喘"。
//       答 no → 桂枝汤；答 yes → 加厚朴杏子汤。
const { Engine } = require('./engine/engine')
const { Asker } = require('./engine/asker')

// 模拟真实插件设计：
//   桂枝汤(guizhi)      needs=[发热.yes, 汗出.yes, 恶风.yes, 喘.no]
//   桂枝加厚朴杏子汤(houpo) needs=[发热.yes, 汗出.yes, 恶风.yes, 喘.yes]
const registry = {
  fever:  { name:'fever',  title:'发热', kind:'symptom', trigger:t=>t.includes('发热') },
  sweat:  { name:'sweat',  title:'汗出', kind:'symptom', trigger:t=>t.includes('汗') || t.includes('出汗') },
  wind:   { name:'wind',   title:'恶风', kind:'symptom', trigger:t=>t.includes('恶风') || t.includes('怕风') },
  chuan:  { name:'chuan',  title:'喘',   kind:'symptom', trigger:t=>t.includes('喘'), negate:t=>t.includes('不喘') },
  guizhi: { name:'guizhi', title:'桂枝汤', kind:'formula', needs:['fever.yes','sweat.yes','wind.yes','chuan.no'] },
  houpo:  { name:'houpo',  title:'桂枝加厚朴杏子汤', kind:'formula', needs:['fever.yes','sweat.yes','wind.yes','chuan.yes'] }
}

let pass=0, fail=0
function check(name, got, want){ if(got===want){pass++} else {fail++; console.log(`✗ ${name}: 期望${want} 实际${got}`)} }

// --- 场景1: 报桂枝证，喘未知 → 应反问"喘" ---
let e = new Engine(registry)
e.feed('我发热，出汗，怕风')
let a = new Asker(e)
let q = a.nextQuestion()
console.log('场景1 反问建议:', q ? q.title : '(无)')
check('场景1 反问喘', q && q.leaf, 'chuan')
check('场景1 桂枝暂未定', e.state.guizhi, 'unknown')
check('场景1 加厚朴暂未定', e.state.houpo, 'unknown')

// --- 场景2: 病人答"不喘" → 桂枝汤 yes，加厚朴被阻断 no ---
e.feed('不喘')
a = new Asker(e)
console.log('场景2 桂枝:', e.state.guizhi, ' 加厚朴:', e.state.houpo)
check('场景2 桂枝汤成立', e.state.guizhi, 'yes')
check('场景2 加厚朴被废弃', e.state.houpo, 'no')

// --- 场景3: 重新来，病人答"喘" → 加厚朴 yes，桂枝被阻断 ---
e = new Engine(registry)
e.feed('我发热，出汗，怕风')
e.feed('有点喘')
console.log('场景3 桂枝:', e.state.guizhi, ' 加厚朴:', e.state.houpo)
check('场景3 加厚朴成立', e.state.houpo, 'yes')
check('场景3 桂枝被废弃', e.state.guizhi, 'no')

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
process.exitCode = fail>0?1:0
