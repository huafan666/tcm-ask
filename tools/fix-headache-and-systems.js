'use strict'
// tools/fix-headache-and-systems.js
//
// 两件事：
// ① 补「头痛」节点 —— 库里居然没有，而头痛是极常见的症状：
//    金匮 17.11「干呕吐涎沫，头痛者，茱萸汤主之」、伤寒太阳/少阳/厥阴各篇都用得到
// ② 修系统层的划分问题：
//    - sys_head_body 原来用了 pain_any（全部位疼痛组），把腹痛也算进「头身」，
//      导致头身组膨胀到 74 个症状。新建 head_body_pain_any（只含头颈身肢的痛）替代
//    - 胸部疼痛几个节点（胸痛连背/心中结痛/心悬痛/心痛彻背）原来只挂在 pain_any，
//      归进了「头身」。把它们补进 hypochondrium_any（胸胁），这样归「胸腹」系统
// ③ 把上一轮 sleep_any 的手工修改同步回 data/symptom-groups.js（它是唯一真源，
//    否则下次重新生成会把睡眠的细化覆盖掉）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

// ---------- ① 头痛节点 ----------
const HEADACHE = {
  name: 'headache',
  title: '头痛',
  kind: 'symptom',
  comment: '头痛（含各部位头痛）。金匮 17.11「干呕吐涎沫，头痛者，茱萸汤主之」；伤寒太阳病头项强痛、少阳头痛、厥阴巅顶痛均用得到。',
  trigger: ['头痛', '头疼', '脑袋疼', '头胀痛', '偏头痛', '后脑勺痛', '太阳穴痛',
    '头顶痛', '头一阵阵地痛', '头痛得厉害'],
  negate: ['头不痛', '头不疼'],
  ask: '是不是头痛？（哪个部位都算）'
}

// ---------- ② 新建 head_body_pain_any 分组 ----------
const HEAD_BODY_PAIN = {
  name: 'head_body_pain_any',
  title: '头颈身肢疼痛',
  dimension: '部位',
  ask: '是不是头、颈、身上或者手脚有关节疼痛？',
  trigger: ['头痛', '头疼', '项痛', '颈痛', '身上痛', '身痛', '关节痛', '腰腿痛', '足跟痛'],
  children: ['headache', 'neck_stiff_pain', 'body_pain', 'body_ache_stiff',
    'joint_pain_rigid', 'joint_pain_severe', 'migratory_pain', 'yaguan_tong',
    'fengchi_tong', 'zugengtong'],
  notIncluded: '胸腹部的痛（归胸腹）、腰酸（酸不是痛）'
}

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

if (registry.headache) { console.log('❌ headache 已存在'); process.exit(1) }
if (registry.head_body_pain_any) { console.log('❌ head_body_pain_any 已存在'); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (!WRITE) {
  console.log('将新建：headache（头痛）、head_body_pain_any（头颈身肢疼痛）')
  console.log('将修改：data/symptom-groups.js（sleep_any 同步、hypochondrium_any 补胸部疼痛）')
  console.log('（预览，加 --write 落库）')
  process.exit(0)
}

// 1. 头痛
fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'headache.js'), render(HEADACHE), 'utf8')
console.log('  ＋ 症状 headache（头痛）')

// 2. 同步 data/symptom-groups.js（真源）
{
  const gp = path.join(ROOT, 'data', 'symptom-groups.js')
  let src = fs.readFileSync(gp, 'utf8')

  // 2a. sleep_any：children 加 3 个新节点、trigger 收窄
  const oldSleep = /(\n  \{\n    name: 'sleep_any',[\s\S]*?)(\n  \},)/.exec(src)
  if (oldSleep) {
    const block = `\n  {
    name: 'sleep_any',
    title: '睡眠异常',
    dimension: '状态',
    ask: '是不是睡觉有问题——睡不着、老想睡、多梦或者睡不好？',
    // 病人说「睡眠不好」只是笼统描述，必须细化到下面几种具体类型。
    // vague 子节点（shuimianbuhao）不算「已说清」，问诊会继续往下问。
    trigger: ['睡眠', '睡不好', '睡不着', '失眠', '不寐', '多梦', '嗜睡',
      '老想睡', '入睡', '睡不实', '容易醒'],
    children: ['shuimianbuhao', 'insomnia_onset', 'frequent_waking', 'light_sleep',
      'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan'],
    notIncluded: '烦躁（那是情绪）、昏睡不醒（神志问题）'
  },`
    src = src.replace(oldSleep[0], block)
    console.log('  ~ data/symptom-groups.js 的 sleep_any 已同步（加 3 个子症状）')
  } else {
    console.log('  ⚠ 没找到 sleep_any 定义')
  }

  // 2b. hypochondrium_any 补胸部疼痛节点
  const oldHyp = /(name: 'hypochondrium_any',[\s\S]*?children: \[)([\s\S]*?)(\])/
  const m = oldHyp.exec(src)
  if (m) {
    const add = ["'chest_back_pain'", "'heart_bind_pain'", "'heart_hanging_pain'", "'heart_pain_radiate'"]
    const missing = add.filter(a => !m[2].includes(a))
    if (missing.length) {
      src = src.replace(oldHyp, (all, head, body, tail) => head + body.replace(/\s*$/, '') + ', ' + missing.join(', ') + tail)
      console.log('  ~ hypochondrium_any 补入胸部疼痛 ' + missing.join('、'))
    }
  } else {
    console.log('  ⚠ 没找到 hypochondrium_any')
  }

  // 2c. 追加 head_body_pain_any
  const marker = 'module.exports = { GROUPS }'
  const block = `  {
    name: 'head_body_pain_any',
    title: '头颈身肢疼痛',
    dimension: '部位',
    ask: '是不是头、颈、身上或者手脚有关节疼痛？',
    trigger: ['头痛', '头疼', '项痛', '颈痛', '身上痛', '身痛', '关节痛', '腰腿痛', '足跟痛'],
    children: ['headache', 'neck_stiff_pain', 'body_pain', 'body_ache_stiff',
      'joint_pain_rigid', 'joint_pain_severe', 'migratory_pain', 'yaguan_tong',
      'fengchi_tong', 'zugengtong'],
    notIncluded: '胸腹部的痛（归胸腹）
  }
]
`
  src = src.replace(/\]\s*\n\s*module\.exports = \{ GROUPS \}/, ',\n' + block + '\nmodule.exports = { GROUPS }')
  fs.writeFileSync(gp, src, 'utf8')
  console.log('  ~ data/symptom-groups.js 追加 head_body_pain_any')
}

const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
prov.nodes.headache = {
  source: 'jinkui', label: '金匮要略 17.11 + 伤寒论各篇',
  refs: ['金匮要略·呕吐哕下利病脉证并治第十七：干呕吐涎沫，头痛者，茱萸汤主之'], by: 'system:jinkui'
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n完成。下一步：node tools/apply-symptom-groups.js --write 再重生成分组')
