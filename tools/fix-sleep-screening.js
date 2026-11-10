'use strict'
// tools/fix-sleep-screening.js —— 睡眠初筛重构
//
// 用户指出的问题：像「睡眠不好」这种必须初筛，不能一说就定方。
//
// 现状（实测）：
//   病人只说一句「睡眠不好」→ 立刻点亮方剂「炙甘草」，还点亮证候「肝血不足」
//   而且睡眠只有笼统的一个节点 shuimianbuhao，没有区分「睡不着 / 容易醒 / 睡不浅」
//
// 改法（遵循「节点原子化 + 先粗筛后细化」）：
//   1. 把笼统的「睡眠不好」拆出三个原子症状：
//        入睡困难 / 睡着了容易醒 / 睡眠浅
//      这些说法原来是塞在 shuimianbuhao 的 trigger 里的，现在搬走
//   2. shuimianbuhao 只保留最笼统的说法，并明确它是「待细化的粗描述」，
//      **任何方剂/证候都不得直接依赖它**
//   3. 炙甘草（单味药，临床上用于强心）原来靠「睡眠不好」成立 → 改挂心悸
//   4. 肝血不足原来有一条靠「睡眠不好+脱发+黄疸」→ 改用「入睡困难+脱发」
//   5. sleep_any 组的 trigger 去掉单字「睡」「眠」（太宽），并把三个新节点收进来
//   6. 顺带：胃酸 → 改成「反酸/烧心」（用户：胃酸是现代人的说法，改到符合临床）
//      旋覆代赭汤那条单「胃酸」路径 → 反酸 + 嗳气（胃虚气逆反酸的临床组合）
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

// ---------- 新的三个原子睡眠症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'insomnia_onset',
    title: '入睡困难',
    kind: 'symptom',
    comment: '躺下很久睡不着（入睡困难）。与「虚烦不得眠」区分：这里是单纯的入睡慢，不强调心里烦。',
    trigger: ['入睡困难', '躺下好久睡不着', '躺半天睡不着', '迟迟睡不着', '躺下睡不着',
      '入睡费劲', '一躺下脑子就清醒', '闭眼就是睡不着'],
    negate: ['一躺下就睡', '入睡很快'],
    ask: '是不是躺下以后要很久才睡得着？'
  },
  {
    name: 'frequent_waking',
    title: '睡着了容易醒',
    kind: 'symptom',
    comment: '能在睡着之后反复醒来（易醒）。与「入睡困难」区分：那个是睡不着，这个是睡不连续。',
    trigger: ['睡着了容易醒', '容易醒', '睡着了老醒', '半夜老醒', '醒好几次',
      '睡一会就醒', '夜里总醒', '醒醒睡睡'],
    negate: ['一觉到天亮', '中间不醒'],
    ask: '是不是睡着了也容易醒，一晚上要醒好几次？'
  },
  {
    name: 'light_sleep',
    title: '睡眠浅',
    kind: 'symptom',
    comment: '睡得浅、睡不实、有点动静就醒（睡眠深度不够）。',
    trigger: ['睡眠浅', '睡得浅', '睡不实', '睡得不沉', '一有动静就醒',
      '睡得很轻', '睡眠比较浅'],
    negate: ['睡得很沉'],
    ask: '是不是睡得很浅，一点动静就醒、睡不踏实？'
  }
]

// ---------- 要从 shuimianbuhao 里搬走、改挂到新节点的说法 ----------
const SHUIMIAN_KEEP = ['睡眠不好', '睡不好', '失眠', '睡得不好']
const SHUIMIAN_NOTE = [
  '⚠ 这是一个**笼统的粗描述**，只是病人开口的第一句话。',
  '必须靠反问细化到「入睡困难 / 睡着了容易醒 / 睡眠浅 / 多梦 / 虚烦不得眠」才可用于推理。',
  '**任何方剂或证候都不得直接依赖本节点**——否则病人一说「睡眠不好」就定方，这是用户明确否掉的。'
]

// ---------- 要改 needs 的节点 ----------
const NEEDS_FIX = [
  {
    id: 'zhigancao', kind: 'formula', dir: 'formulas',
    needs: [['heart_palp.yes']],
    why: '单味炙甘草原来的条件是「睡眠不好」，临床不对——炙甘草的用处是补气强心（它自己的说明就写着「可以强心」），改挂心悸',
    extraContra: ['原条件「睡眠不好」不成立：炙甘草不治睡眠不好，改为临床实际的「心悸（强心）」']
  },
  {
    id: 'ganxuebuzu', kind: 'summary', dir: 'syndromes',
    needs: [
      ['tuofa.yes', 'insomnia_onset.yes'],
      ['tuofa.yes', 'duomeng.yes'],
      ['tuofa.yes', 'face_pale.yes'],
      ['tuofa.yes']
    ],
    why: '原第三条「睡眠不好+脱发+黄疸」——睡眠不好太笼统；肝血不足的典型表现是脱发+失眠多梦/面色淡，改成具体类型',
    extraContra: ['肝血不足的睡眠表现按具体类型判：入睡困难 / 多梦，不用「睡眠不好」这个笼统说法']
  },
  {
    id: 'xuanfu_daizhe_tang', kind: 'formula', dir: 'formulas',
    needs: [
      ['epigastric_lump_soft.yes', 'belching.yes'],
      ['wei_suan.yes', 'belching.yes']
    ],
    why: '原第二条只有「胃酸」一个条件（不在条文里）。临床上旋覆代赭汤治胃虚气逆：反酸 + 嗳气 才是它的典型组合，单反酸不够',
    extraContra: ['反酸路径补上「嗳气」——胃虚气逆的诊断要点是噫气不除，单有反酸不足以定本方']
  }
]

// ---------- sleep_any 组的新 trigger ----------
const SLEEP_ANY_TRIGGER = ['睡眠', '睡不好', '睡不着', '失眠', '不寐', '多梦', '嗜睡',
  '老想睡', '入睡', '睡不实', '容易醒']
const SLEEP_ANY_CHILDREN = ['shuimianbuhao', 'insomnia_onset', 'frequent_waking', 'light_sleep',
  'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan']

// ---------- wei_suan 改名更临床 ----------
const WEI_SUAN = {
  name: 'wei_suan', title: '反酸/烧心', kind: 'symptom',
  comment: '反酸、烧心（现代人的说法），中医属胃气上逆。',
  trigger: ['胃酸', '酸水', '反酸', '烧心', '反胃酸', '胸口烧得慌', '胃里往上返酸'],
  negate: ['不反酸', '没有烧心'],
  ask: '是不是会反酸水、烧心？'
}

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const errors = []
for (const s of NEW_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const n of NEEDS_FIX) {
  if (!registry[n.id]) { errors.push('找不到 ' + n.id); continue }
  for (const p of n.needs) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !NEW_SYMPTOMS.some(x => x.name === dep)) {
      errors.push(n.id + ' 引用不存在的 ' + dep)
    }
  }
}
if (!registry.shuimianbuhao) errors.push('找不到 shuimianbuhao')
if (!registry.sleep_any) errors.push('找不到 sleep_any')
if (errors.length) { console.log('❌ 校验失败:\n  ' + errors.join('\n  ')); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

function patchTriggerAddOnly(file, keep) {
  const p = path.join(PLUGINS, 'symptoms', file + '.js')
  let src = fs.readFileSync(p, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  src = src.replace(m[0], '[' + keep.map(k => "'" + k + "'").join(', ') + '].some')
  fs.writeFileSync(p, src, 'utf8')
}

// 预演
console.log('=== 新建 3 个原子睡眠症状 ===')
for (const s of NEW_SYMPTOMS) console.log('  ＋ ' + s.name + '（' + s.title + '）  ' + s.ask)
console.log('\n=== shuimianbuhao 收窄 ===')
console.log('  trigger 只保留最笼统的：' + SHUIMIAN_KEEP.join('、'))
console.log('  （原本「睡眠浅」「容易醒」「睡不实」等搬到新节点）')
console.log('\n=== 解除「睡眠不好 → 方剂/证候」的直接依赖 ===')
for (const n of NEEDS_FIX) {
  console.log('  ' + n.id + '（' + registry[n.id].title + '）')
  for (const p of n.needs) console.log('     ' + p.join(' + '))
  console.log('     理由：' + n.why)
}
console.log('\n=== sleep_any 组 ===')
console.log('  trigger：' + SLEEP_ANY_TRIGGER.join('、'))
console.log('  children：' + SLEEP_ANY_CHILDREN.join('、'))
console.log('\n=== 胃酸 → 反酸/烧心 ===')
console.log('  ' + WEI_SUAN.trigger.join('、'))

if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

// 1. 新建三个症状
for (const s of NEW_SYMPTOMS) {
  fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
  console.log('  ＋ 症状 ' + s.name)
}
// 2. shuimianbuhao 收窄 + 说明
{
  const p = path.join(PLUGINS, 'symptoms', 'shuimianbuhao.js')
  const src = fs.readFileSync(p, 'utf8')
  const orig = (/ask:\s*'([^']*)'/.exec(src) || [, ''])[1]
  fs.writeFileSync(p, render({
    name: 'shuimianbuhao', title: '睡眠不好（笼统说法）', kind: 'symptom',
    comment: SHUIMIAN_NOTE.join(' '),
    trigger: SHUIMIAN_KEEP,
    ask: '是不是睡眠不好？（先答这句，后面我再问你是哪一种）'
  }), 'utf8')
  console.log('  ~ shuimianbuhao 已收窄，标题改为「睡眠不好（笼统说法）」')
}
// 3. 改 needs
for (const n of NEEDS_FIX) {
  const def = registry[n.id]
  const fp = path.join(PLUGINS, n.dir, n.id + '.js')
  const src = fs.readFileSync(fp, 'utf8')
  const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
  fs.writeFileSync(fp, render({
    name: n.id, title: def.title, kind: def.kind, comment,
    needs: n.needs,
    contraindications: (def.contraindications || []).concat(n.extraContra)
  }), 'utf8')
  console.log('  ~ ' + n.id + ' needs 已改')
}
// 4. sleep_any
{
  const p = path.join(PLUGINS, 'symptoms', 'sleep_any.js')
  const src = fs.readFileSync(p, 'utf8')
  const askM = /ask:\s*'([^']*)'/.exec(src)
  fs.writeFileSync(p, render({
    name: 'sleep_any', title: '睡眠异常', kind: 'symptom_group',
    trigger: SLEEP_ANY_TRIGGER, ask: askM ? askM[1] : '',
    children: SLEEP_ANY_CHILDREN,
    contraindications: [
      '【症状筛选组】只做粗筛，不参与证候/方剂的推理判定',
      '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立',
      '维度：状态｜本组的作用就是**必须在睡眠问题上先粗筛**：先确认「睡觉有没有问题」，再细化到入睡困难/易醒/睡眠浅/多梦/虚烦',
      '另外不收：烦躁（那是情绪）、昏睡不醒（神志问题）、打鼾（呼吸）'
    ]
  }), 'utf8')
  console.log('  ~ sleep_any 已重建（新增 3 个子症状、trigger 去掉单字）')
}
// 5. wei_suan
fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'wei_suan.js'), render(WEI_SUAN), 'utf8')
console.log('  ~ wei_suan 改为「反酸/烧心」')

// 6. provenance
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
for (const s of NEW_SYMPTOMS) {
  prov.nodes[s.name] = { source: 'manual', label: '睡眠症状细化', refs: [s.comment], by: 'system:fix' }
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('\n完成')
