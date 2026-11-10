'use strict'
// tools/apply-jingui-2-14-2-27.js
// 金匮批 3：湿病/暍病 剩下的方剂与关键证候
//   2.14 湿痹（证候）        2.20 麻黄加术汤        2.21 麻杏薏甘汤
//   2.25/2.26 暍病（证候）   2.27 一物瓜蒂汤
//
// 用户原则不变：要素按事实、不强制数量/阴性；AND 只放该方的关键症状；病机与症状拆开；
// 现代佐证只进说明与 trigger 口语词。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')
const CH2 = '金匮要略·痉湿暍病脉证并治第二'

// ---------- 新症状（原文关键要素，库里确实没有的）----------
const NEW_SYMPTOMS = []   // 身疼重 已拆成 body_pain + body_heavy（见 tools/split-nodes.js）

// ---------- 新方剂 ----------
const NEW_FORMULAS = [
  {
    name: 'mahuang_jia_zhu_tang',
    title: '麻黄加术汤',
    kind: 'formula',
    comment: CH2 + '：湿家身烦疼，可与麻黄加术汤发其汗为宜，慎不可以火攻之。',
    // 关键症状：一身烦疼（湿家身痛）+ 无汗（麻黄剂的前提，湿家表实）
    needs: [['body_ache_stiff.yes', 'no_sweat.yes']],
    contraindications: [
      '寒湿在表、表实无汗，故用麻黄汤加白术微发其汗',
      '「发其汗为宜，慎不可以火攻之」——禁火攻（温针、火熏）',
      '无汗是麻黄剂的前提（本条未明写，由「发其汗为宜」与麻黄本方推定）',
      '与防己黄芪汤区别：本方无汗（表实），防己黄芪汤汗出恶风（表虚）'
    ],
    ref: CH2 + ' · 湿家身烦疼，可与麻黄加术汤发其汗为宜，慎不可以火攻之'
  },
  {
    name: 'maxing_yigan_tang',
    title: '麻黄杏仁薏苡甘草汤',
    kind: 'formula',
    comment: CH2 + '：病者一身尽疼，发热，日晡所剧者，名风湿。此病伤于汗出当风，或久伤取冷所致也。可与麻黄杏仁薏苡甘草汤。',
    // 一身尽疼 + 发热 + 日晡所剧（= 潮热，定时加重）
    needs: [['body_pain.yes', 'fever.yes', 'tidal_fever.yes']],
    contraindications: [
      '风湿在表、有化热之势：一身尽疼、发热而日晡加重',
      '「日晡所剧」是风湿化热的定时加重（对应现有「潮热」节点）',
      '病因为汗出当风或久伤取冷',
      '麻黄杏仁薏苡甘草汤：微汗祛风、薏苡清热除湿（比麻黄加术汤多一层清热）'
    ],
    ref: CH2 + ' · 病者一身尽疼，发热，日晡所剧者，名风湿……可与麻黄杏仁薏苡甘草汤'
  },
  {
    name: 'yiwu_guadi_tang',
    title: '一物瓜蒂汤',
    kind: 'formula',
    comment: CH2 + '：太阳中暍，身热疼重，而脉微弱，此以夏月伤冷水，水行皮中所致也，一物瓜蒂汤主之。',
    needs: [['fever.yes', 'body_pain.yes', 'body_heavy.yes']],
    contraindications: [
      '暑令伤于冷水、水湿郁于肌表：身热而疼重',
      '与白虎加人参汤（暍病津伤）区别：本方是水湿在表、无大渴大汗',
      '与瓜蒂散（痰涎在胸、寸脉微浮）是完全不同的两张方，不要混',
      '脉微弱属虚，瓜蒂汤取吐法，须慎'
    ],
    ref: CH2 + ' · 太阳中暍，身热疼重，而脉微弱……一物瓜蒂汤主之'
  }
]

// ---------- 新证候 ----------
const NEW_SUMMARIES = [
  {
    name: 'shi_bi',
    title: '湿痹',
    kind: 'summary',
    comment: CH2 + '：太阳病，关节疼痛而烦，脉沉而细者，此名湿痹。湿痹之候，小便不利，大便反快，但当利其小便。',
    // 关节疼痛而烦 + 小便不利（湿痹的关键组合）；大便反快为兼证，单列一条
    needs: [
      ['joint_pain_rigid.yes', 'urination_difficulty.yes'],
      ['joint_pain_rigid.yes', 'urination_difficulty.yes', 'diarrhea.yes']
    ],
    contraindications: [
      '湿痹：关节疼痛而烦（湿着关节、阳气不通）',
      '小便不利是关键——湿无出路，故治则「但当利其小便」',
      '大便反快（便溏而快）是湿胜的另一面，非脾虚下利',
      '本条未出方：治则在利小便（五苓散类），不出具体方'
    ],
    ref: CH2 + ' · 太阳病，关节疼痛而烦……此名湿痹……但当利其小便'
  },
  {
    name: 'ye_bing',
    title: '暍病',
    kind: 'summary',
    comment: CH2 + '：太阳中热者，暍是也。汗出恶寒，身热而渴，白虎加人参汤主之。（2.25：太阳中暍，发热恶寒，身重而疼痛……手足逆冷）',
    needs: [
      ['sweat.yes', 'cold_aversion.yes', 'fever.yes', 'thirsty.yes'],
      ['fever.yes', 'cold_aversion.yes', 'body_heavy.yes', 'cold_extremities.yes']
    ],
    contraindications: [
      '暍病＝夏季暑热所伤：汗出恶寒、身热而渴（汗多肌疏故恶寒，非表实证）',
      '第二路径对应 2.25：发热恶寒、身重疼痛而手足逆冷（暑热内郁、阳气不达四末）',
      '治禁：不可发汗（汗之则恶寒甚）、不可温针（温针则发热甚）、不可数下（下之则淋甚）',
      '主方：白虎加人参汤（津伤）；水湿在表者一物瓜蒂汤'
    ],
    ref: CH2 + ' · 太阳中热者，暍是也……白虎加人参汤主之'
  }
]

// ---------- 校验 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

function kwsOf(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}

const errors = []
for (const s of NEW_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const f of NEW_FORMULAS.concat(NEW_SUMMARIES)) if (registry[f.name] && !FORCE) errors.push(f.name + ' 已存在（--force 覆盖）')
for (const f of NEW_FORMULAS.concat(NEW_SUMMARIES)) {
  for (const path1 of (f.needs || [])) for (const c of path1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !NEW_SYMPTOMS.some(s => s.name === dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

console.log('=== 触发词查重 ===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      if (name === s.name) continue
      for (const other of kwsOf(registry[name])) {
        if (other === kw || other.includes(kw) || kw.includes(other)) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name + ' 的「' + other + '」重叠'); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处' : '  没有撞车 ✓')

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 症状 ' + s.name + '（' + s.title + '）')
  }
  for (const f of NEW_FORMULAS) {
    if (registry[f.name] && !FORCE) continue
    fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 方剂 ' + f.name + '（' + f.title + '）')
  }
  for (const s of NEW_SUMMARIES) {
    if (registry[s.name] && !FORCE) continue
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 证候 ' + s.name + '（' + s.title + '）')
  }
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原方', refs: [s.comment.replace(/^金匮要略·[^：]*：/, '')], by: 'system:jinkui' }
  for (const f of NEW_FORMULAS.concat(NEW_SUMMARIES)) {
    prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原方', refs: [f.ref || f.comment.replace(/^金匮要略·[^：]*：/, '')], by: 'system:jinkui' }
  }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：1 症状 + 3 方剂 + 2 证候 + provenance')
} else {
  for (const x of [].concat(NEW_FORMULAS, NEW_SUMMARIES)) {
    const dir = x.kind === 'symptom' ? 'symptoms' : (x.kind === 'formula' ? 'formulas' : 'syndromes')
    console.log('\n=== plugins/' + dir + '/' + x.name + '.js ===')
    console.log(render(x))
  }
  console.log('\n（预览，加 --write 落库）')
}
