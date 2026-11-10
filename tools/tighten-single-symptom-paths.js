'use strict'
// tools/tighten-single-symptom-paths.js
//
// 用户指示：阴性条件可以增加，但要符合真实情况。
//
// 处理原则（重要）：
//   · **只改条文里本来就含多个要素的**，把单症状路径补成条文实际要求的组合 —— 这是还原原文，不是加码
//   · **条文本身就只有这一个症状的，一律不动**（例如「食已即吐者，大黄甘草汤主之」）
//   · 不臆造原文没有的阴性条件（不做「为收敛而收敛」）
//   · 药味组合/自造方（补肾组合、牡蛎瓦楞子…）不在本次范围，另案处理
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

// 每条都注明条文依据
const FIX = [
  {
    id: 'guizhi_shengjiang_zhishi_tang',
    title: '桂枝生姜枳实汤',
    src: '金匮 9.8：心中痞，诸逆，心悬痛，桂枝生姜枳实汤主之',
    why: '原文有「心中痞」——心口堵，之前的单症状路径只要求「心悬痛」',
    drop: [['heart_hanging_pain.yes']],
    add: [['heart_hanging_pain.yes', 'chest_qi_stuffiness.yes']]
  },
  {
    id: 'huangqi_jianzhong_tang',
    title: '黄芪建中汤',
    src: '金匮 6.15：虚劳里急、诸不足，黄芪建中汤主之',
    why: '原文是「虚劳」+「里急」两件事，单症状路径只有「肚子拘急」',
    drop: [['abdominal_tension.yes']],
    add: [['abdominal_tension.yes', 'xu_lao.yes']]
  },
  {
    id: 'wutou_tang',
    title: '乌头汤',
    src: '金匮 5.13 病历节不可屈伸，疼痛；5.14 乌头汤方治脚气疼痛，不可屈伸',
    why: '脚气那条原文也写着「不可屈伸」，单症状路径漏掉了这个关键要素',
    drop: [['jiao_qi_pain.yes']],
    add: [['jiao_qi_pain.yes', 'joint_pain_rigid.yes']]
  },
  {
    id: 'chishizhi_yuyuliang_tang',
    title: '赤石脂禹余粮汤',
    src: '伤寒 159：伤寒服汤药，下利不止，心下痞硬……赤石脂禹余粮汤主之',
    why: '原文是「下利不止」——强调久利不止，不只是下利清谷',
    drop: [['clear_grain_diarrhea.yes']],
    add: [['clear_grain_diarrhea.yes', 'chronic_diarrhea.yes']]
  },
  {
    id: 'kujiu_tang',
    title: '苦酒汤',
    src: '伤寒 312：少阴病，咽中伤，生疮，不能语言，声不出者，苦酒汤主之',
    why: '原文核心是「咽中伤生疮」+「不能语言，声不出」。原来的单症状路径（吞咽困难、喉咙紧缩）都太松，' +
      '统一收成「喉咙紧缩 + 声音嘶哑」这一条（对应「咽中伤 + 声不出」）',
    drop: [['tunyankunnan.yes'], ['houlongjinsuo.yes']],
    add: [['houlongjinsuo.yes', 'voice_hoarse.yes']]
  },
  {
    id: 'fengyin_tang',
    title: '风引汤',
    src: '金匮 5.5：风引汤除热瘫痫',
    why: '原文是「热瘫痫」——抽搐是「痫」，还带有「热」，单症状只有抽搐',
    drop: [['epileptic_seizure.yes']],
    add: [['epileptic_seizure.yes', 'fever.yes']]
  },
  {
    id: 'danggui_san',
    title: '当归散',
    src: '金匮 20.21：妇人妊娠，宜常服当归散主之',
    why: '⚠ 特殊处理：原文虽然是妊娠通用方，但「只要怀孕 → 当归散」会让**任何孕妇**都命中，' +
      '与我自己写在 contraindications 里的「不主张无症状孕妇长期服药」矛盾。' +
      '所以删掉这条单症状路径，只保留「妊娠 + 具体不适」的两条。',
    drop: [['pregnancy.yes']],
    add: []
  }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
const eng = new (require(path.join(ROOT, 'engine/engine')).Engine)(registry)

const errors = []
for (const f of FIX) {
  if (!registry[f.id]) { errors.push('找不到 ' + f.id); continue }
  for (const p of f.add) for (const c of p) {
    const dep = String(c).split('.')[0]
    if (!registry[dep]) errors.push(f.id + ' 新增引用不存在的节点 ' + dep)
  }
  // 确认本来就有这条要被替换的路径
  const paths = eng.normalizeNeeds(registry[f.id].needs)
  const sig = paths.map(p => p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+'))
  for (const d of f.drop) {
    const s = d.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
    if (!sig.includes(s)) errors.push(f.id + ' 找不到要替换的路径 ' + JSON.stringify(d))
  }
}
if (errors.length) { console.log('❌ 校验失败:\n  ' + errors.join('\n  ')); process.exit(1) }

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

const plan = []
for (const f of FIX) {
  const def = registry[f.id]
  const oldPaths = eng.normalizeNeeds(def.needs)
  const sigOf = p => p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
  const dropSig = f.drop.map(d => sigOf(d))
  let newPaths = oldPaths.filter(p => !dropSig.includes(sigOf(p)))
  for (const add of f.add) {
    if (!newPaths.some(p => sigOf(p) === sigOf(add))) newPaths.push(add)
  }
  // 去重（严格按条件集合）
  const seen = new Set()
  newPaths = newPaths.filter(p => { const s = sigOf(p); if (seen.has(s)) return false; seen.add(s); return true })
  plan.push({ ...f, oldPaths, newPaths })
  console.log('=== ' + f.title + ' ===')
  console.log('  依据：' + f.src)
  console.log('  原因：' + f.why)
  console.log('  改前 ' + oldPaths.length + ' 条 → 改后 ' + newPaths.length + ' 条')
  for (const p of newPaths) console.log('     ' + p.join(' + '))
  const stillLoose = newPaths.filter(p => p.length === 1)
  if (stillLoose.length) console.log('  ℹ 仍保留的单症状路径 ' + stillLoose.length + ' 条（条文本身如此）')
}

if (!WRITE) { console.log('\n（预览，加 --write 落库）'); process.exit(0) }

for (const f of plan) {
  const def = registry[f.id]
  const fp = path.join(PLUGINS, 'formulas', f.id + '.js')
  const src = fs.readFileSync(fp, 'utf8')
  const comment = (/^\/\/\s*(.+)$/m.exec(src) || [, ''])[1]
  fs.writeFileSync(fp, render({
    name: f.id, title: def.title, kind: 'formula', comment,
    needs: f.newPaths,
    contraindications: (def.contraindications || []).concat(['条文收紧依据：' + f.src])
  }), 'utf8')
  console.log('  ~ ' + f.id + ' 已收紧')
}
console.log('\n完成 ' + plan.length + ' 个方剂')
