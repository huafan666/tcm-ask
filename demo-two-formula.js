// demo-two-formula.js
// 演示：两个方剂【1,2,3】和【1,2,4】，当证据 1,2,3,4 全出现时，两个方同时成立。
const { Engine } = require('./engine/engine')

// 手动构造一个小注册表（不写文件，纯演示）
const registry = {
  s1: { name: 's1', title: '症状1', kind: 'symptom', trigger: t => t.includes('症状1') },
  s2: { name: 's2', title: '症状2', kind: 'symptom', trigger: t => t.includes('症状2') },
  s3: { name: 's3', title: '症状3', kind: 'symptom', trigger: t => t.includes('症状3') },
  s4: { name: 's4', title: '症状4', kind: 'symptom', trigger: t => t.includes('症状4') },
  fA: { name: 'fA', title: '方剂A[1,2,3]', kind: 'formula', needs: ['s1.yes','s2.yes','s3.yes'] },
  fB: { name: 'fB', title: '方剂B[1,2,4]', kind: 'formula', needs: ['s1.yes','s2.yes','s4.yes'] }
}

const e = new Engine(registry)
console.log('喂入: "我症状1 症状2 症状3 症状4"\n')
e.feed('我症状1 症状2 症状3 症状4')

console.log('结果状态:')
for (const n of Object.keys(registry)) {
  const s = e.state[n]
  const st = s === 'yes' ? '✓ yes' : (s === 'no' ? '✗ no ' : '· unknown')
  console.log(`  ${st} ${registry[n].title} (${n})`)
}
