'use strict'
// tools/fix-shanghanlun-batch3.js
// ============================================================
// 伤寒论逐条过 · 第 3 批：辨太阳病（下）51 条
//
// 这一批没有缺方（唯一点到的都建过了），全部是**补否定/鉴别条件**：
// 174 条明写「不呕不渴」，166 条明写「头不痛，项不强」，152 条明写「汗出不恶寒者」——
// 这些字当初落库时都被当成「伴随症」丢掉了，而它们恰恰是分开方证最锋利的刀。
//
// 用法：
//   node tools/fix-shanghanlun-batch3.js           预览
//   node tools/fix-shanghanlun-batch3.js --write   落库
// ============================================================
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const { loadAll } = require(path.join(ROOT, 'core', 'loader'))
const { registry } = loadAll(PLUGINS)

const PATCH = [
  {
    name: 'guizhi_fuzi_tang',
    title: '桂枝附子汤',
    ref: '174条',
    why: '原文「身体疼烦，不能自转侧，**不呕不渴**」——当初只落了「不渴」，「不呕」丢了。呕是无饮的正面证据，少问一句就分不开湿病和水饮。',
    before: [
      ['body_ache_stiff.yes', 'thirsty.no'],
      ['body_ache_stiff.yes', 'joint_pain_rigid.yes', 'thirsty.no']
    ],
    after: [
      ['body_ache_stiff.yes', 'thirsty.no', 'vomiting.no'],
      ['body_ache_stiff.yes', 'joint_pain_rigid.yes', 'thirsty.no', 'vomiting.no']
    ]
  },
  {
    name: 'guadi_san',
    title: '瓜蒂散',
    ref: '166条',
    why: '原文「病如桂枝证，**头不痛，项不强**……胸中痞硬，气上冲喉咽不得息者，此为胸有寒也，当吐之」——「头不痛项不强」是用来和桂枝汤证划清界限的，不能丢。',
    before: [
      ['chest_lump_hard.yes', 'qi_surge.yes', 'cold_aversion.no']
    ],
    after: [
      ['chest_lump_hard.yes', 'qi_surge.yes', 'headache.no', 'neck_stiff_pain.no']
    ]
  },
  {
    name: 'daxianxiong_tang',
    title: '大陷胸汤',
    ref: '136条',
    why: '136条「但结胸，**无大热**者，此为水结在胸胁也，**但头微汗出**者，大陷胸汤主之」——「但头汗出」是这个方很特异的一个体征，原来完全没认。',
    before: [
      ['full_epigastric_hard_pain.yes', 'cold_aversion.no']
    ],
    after: [
      ['full_epigastric_hard_pain.yes', 'cold_aversion.no'],
      ['full_epigastric_hard_pain.yes', 'head_sweat_only.yes']
    ]
  },
  {
    name: 'shizao_tang',
    title: '十枣汤',
    ref: '152条',
    why: '152条「心下痞硬满，引胁下痛，干呕短气，**汗出不恶寒者**，此表解里未和也」——「不恶寒」是判定表已解、可以攻里的前提。',
    before: [
      ['epigastric_lump_soft.yes', 'hypochondriac_fullness.yes'],
      ['cough.yes', 'hypochondriac_fullness.yes'],
      ['xuan_yin.yes']
    ],
    after: [
      ['epigastric_lump_soft.yes', 'hypochondriac_fullness.yes', 'cold_aversion.no'],
      ['cough.yes', 'hypochondriac_fullness.yes'],
      ['xuan_yin.yes']
    ]
  }
]

// ---------- 校验 ----------
const errors = []
for (const f of PATCH) {
  const d = registry[f.name]
  if (!d) { errors.push('找不到要改的方：' + f.name); continue }
  const now = JSON.stringify(d.needs || [])
  if (now !== JSON.stringify(f.before)) {
    errors.push(f.name + ' 现状与预期不一致（可能别的批次改过）：\n      实际 ' + now + '\n      预期 ' + JSON.stringify(f.before))
  }
  for (const p of f.after) {
    if (!p.length) errors.push(f.name + ' 有空路径')
    for (const c of p) {
      const dep = String(c).split('.')[0]
      if (!registry[dep]) errors.push(f.name + ' 引用了不存在的节点 ' + dep)
    }
  }
}

console.log('=== 伤寒论逐条过 · 第 3 批（辨太阳病下 51 条）===')
console.log('缺方 0 个；修改 ' + PATCH.length + ' 个已有方的 needs：')
for (const f of PATCH) console.log('  ~ ' + f.title.padEnd(12) + f.ref.padEnd(7) + f.why)

if (errors.length) {
  console.log('\n❌ 校验失败：')
  for (const e of errors) console.log('  ' + e)
  process.exit(1)
}
if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

for (const f of PATCH) {
  const file = path.join(PLUGINS, 'formulas', f.name + '.js')
  const text = fs.readFileSync(file, 'utf8')
  const res = P.patchPluginSource(text, { needs: f.after.map(p => p.map(c => P.condToRef(c))) })
  if (!res.changed) { console.log('  （无变化）' + f.name); continue }
  fs.writeFileSync(file, res.text, 'utf8')
  console.log('  ~ ' + f.name + '  [' + res.changedFields.join(',') + ']')
  for (const n of res.notes) console.log('      注：' + n)
}
console.log('\n已写入 ' + PATCH.length + ' 处修改')
