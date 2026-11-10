'use strict'
// tools/apply-jingui-xiaoke.js
// 金匮批 15：第十三篇 消渴小便不利淋病脉证并治（13.1 ~ 13.16）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 13.2 / 13.3 / 13.9 以脉象立论、13.10 是禁忌条 → 不落节点。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH13 = '金匮要略·消渴小便不利淋病脉证并治第十三'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'polyuria',
    title: '尿特别多',
    kind: 'symptom',
    comment: CH13 + '：男子消渴，小便反多，以饮一斗，小便一斗。',
    trigger: ['尿特别多', '小便量很多', '喝一斗尿一斗', '喝多少尿多少', '尿量特别大',
      '一天尿好多', '喝了水马上就尿出来很多'],
    negate: ['尿不多', '小便正常'],
    ask: '是不是尿量特别多，喝多少水就尿多少？'
  },
  {
    name: 'polyphagia',
    title: '吃得多还容易饿',
    kind: 'symptom',
    comment: CH13 + '：趺阳脉数，胃中有热，即消谷引食（吃得多、消化快、很快又饿）。',
    trigger: ['吃得多还容易饿', '消谷引食', '吃很多还是饿', '特别能吃还老饿',
      '刚吃完又饿', '饭量大还容易饿', '老是饿得慌吃得多'],
    negate: ['吃不下', '胃口一般'],
    ask: '是不是特别能吃、吃得很多，可很快又饿了？'
  },
  {
    name: 'urine_gravel',
    title: '小便像米粒样砂石',
    kind: 'symptom',
    comment: CH13 + '：淋之为病，小便如粟状（尿中排出砂粒样物）。',
    trigger: ['小便像米粒样', '小便如粟状', '尿里有砂石', '尿出小颗粒', '小便有砂粒状东西',
      '尿里有小结石', '尿出沙子样东西'],
    negate: ['小便清亮'],
    ask: '是不是小便里像有米粒、砂粒一样的东西排出来？'
  },
  {
    name: 'water_reflux',
    title: '喝水就吐',
    kind: 'symptom',
    comment: CH13 + '：渴欲饮水，水入则吐者，名曰水逆。',
    trigger: ['喝水就吐', '一喝水就吐出来', '水入则吐', '喝了水马上呕', '水喝不下去会吐',
      '喝水反而吐水'],
    negate: ['喝水不吐'],
    ask: '是不是很渴想喝水，可水一喝下去就吐出来？'
  },
  {
    name: 'hematuria',
    title: '尿里有血',
    kind: 'symptom',
    comment: CH13 + '：小便不利，蒲灰散主之；滑石白鱼散……（金匮 11.19 亦言「热在下焦者，则尿血」）。',
    trigger: ['尿里有血', '尿血', '小便带血', '尿是红的', '小便发红', '尿中见血'],
    negate: ['尿里没血'],
    ask: '是不是小便里有血、颜色发红？'
  }
]

// ---------- 证候 2 个 ----------
const SUMMARIES = [
  {
    name: 'xiao_ke',
    title: '消渴',
    kind: 'summary',
    comment: CH13 + '：厥阴之为病，消渴，气上冲心，心中疼热，饥而不欲食……男子消渴，小便反多，以饮一斗，小便一斗。',
    needs: [
      // 喝得多 + 尿得多（最典型的消渴）
      ['thirsty.yes', 'polyuria.yes'],
      // 吃得多容易饿 + 大便硬 + 尿频（中消）
      ['polyphagia.yes', 'constipation.yes', 'frequent_urination.yes'],
      // 气上冲心 + 心里疼热 + 饿却不想吃（厥阴消渴）
      ['qi_surge.yes', 'hungry.yes', 'low_appetite.yes'],
      // 喝得多 + 尿频
      ['thirsty.yes', 'frequent_urination.yes']
    ],
    contraindications: [
      '消渴的核心是「喝得多、尿得多、吃得多但人消瘦」，中医认为病机是阴虚燥热',
      '分上中下三消：上消多饮（肺）、中消多食（胃）、下消多尿（肾）',
      '原文有两句很关键：一是「饮一斗，小便一斗」——喝多少尿多少，肾气不固；' +
      '二是「消谷引食，大便必坚，小便即数」——吃得多、大便干、尿频，是胃热',
      '厥阴型的消渴还伴「气上冲心、心中疼热、饥而不欲食、食即吐」（像 13.1 描述的那样）',
      '⚠ 现代医学的糖尿病属于消渴范畴，但消渴不等于糖尿病；确诊要看血糖，不能只凭症状'
    ],
    ref: CH13 + ' · 男子消渴，小便反多，以饮一斗，小便一斗，肾气丸主之'
  },
  {
    name: 'lin_bing',
    title: '淋病',
    kind: 'summary',
    comment: CH13 + '：淋之为病，小便如粟状，小腹弦急，痛引脐中。',
    needs: [
      // 小便如粟状 + 小腹拘急
      ['urine_gravel.yes', 'lower_abdomen_cramp.yes'],
      // 小便如粟状 + 痛引脐中
      ['urine_gravel.yes', 'circumumbilical_pain.yes'],
      // 小便如粟状 + 尿痛感
      ['urine_gravel.yes']
    ],
    contraindications: [
      '中医的「淋病」指**小便淋沥涩痛**的一类病（石淋、气淋、膏淋、劳淋等），' +
      '**不是**现代医学所指的性传播疾病淋病，两者名同实异',
      '本条给出的表现：小便像粟粒、小腹弦急（发紧拘急）、疼痛牵引到肚脐',
      '石淋（尿路结石）的典型表现就是尿中排出砂石样物',
      '原文另有一句禁忌：「淋家不可发汗，发汗则必便血」——淋病多属下焦湿热、阴液已伤，再发汗会更伤阴动血',
      '⚠ 尿中有砂石、腰痛剧烈、血尿的，建议做泌尿系超声明确结石'
    ],
    ref: CH13 + ' · 淋之为病，小便如粟状，小腹弦急，痛引脐中'
  }
]

// ---------- 方剂 4 个新建 ----------
const FORMULAS = [
  {
    name: 'gualou_qumai_wan',
    title: '栝蒌瞿麦丸',
    kind: 'formula',
    comment: CH13 + '：小便不利者，有水气，其人若渴，栝蒌瞿麦丸主之。',
    needs: [
      // 小便不利 + 口渴（有水气但津不上承）
      ['urination_difficulty.yes', 'thirsty.yes'],
      ['urination_difficulty.yes', 'throat_dry.yes']
    ],
    contraindications: [
      '治小便不利而**同时口渴**——上焦燥热、下焦有水气，水停在下、津不上承，所以既尿不出又口渴',
      '栝蒌根（天花粉）生津止渴，瞿麦、茯苓利水，附子温阳化气，薯蓣（山药）补脾益肾',
      '做成蜜丸（梧子大），「饮服三丸，日三服，不知，增至七八丸，以小便利、腹中温为知」——以小便通、腹中温暖为见效标准',
      '关键是寒热并用：上面要生津、下面要温阳利水'
    ],
    ref: CH13 + ' · 小便不利者，有水气，其人若渴，栝蒌瞿麦丸主之'
  },
  {
    name: 'puhui_san',
    title: '蒲灰散',
    kind: 'formula',
    comment: CH13 + '：小便不利，蒲灰散主之。',
    needs: [
      // 小便不利 + 尿中有血（湿热夹瘀伤血络）
      ['urination_difficulty.yes', 'hematuria.yes'],
      ['urination_difficulty.yes', 'lower_abdomen_cramp.yes']
    ],
    contraindications: [
      '治湿热夹瘀的小便不利、尿中带血',
      '只有两味：蒲灰（蒲黄炒黑，凉血化瘀止血）、滑石（清热利水通淋）',
      '蒲黄既能化瘀又能止血，是「止血不留瘀」的典型药',
      '与同条的滑石白鱼散、茯苓戎盐汤是**并列备选**，原文说「并主之」——' +
      '临床按兼证选用，不是同时吃'
    ],
    ref: CH13 + ' · 小便不利，蒲灰散主之（蒲灰七分、滑石三分，杵为散，饮服方寸匕，日三服）'
  },
  {
    name: 'huashi_baiyu_san',
    title: '滑石白鱼散',
    kind: 'formula',
    comment: CH13 + '：小便不利……滑石白鱼散、茯苓戎盐汤并主之。',
    needs: [
      // 小便不利 + 尿血（血络受损更明显）
      ['urination_difficulty.yes', 'hematuria.yes'],
      ['urination_difficulty.yes', 'abdominal_pain.yes', 'hematuria.yes']
    ],
    contraindications: [
      '与蒲灰散、茯苓戎盐汤并列，同为治小便不利的备选方',
      '三味：滑石（清热利水）、白鱼（即衣鱼，利水）、乱发（血余炭，止血化瘀）',
      '比蒲灰散更偏「化瘀止血」，适合尿血较明显的情况',
      '白鱼（衣鱼）是古方用药，现代多不用，须遵医嘱'
    ],
    ref: CH13 + ' · 滑石白鱼散（滑石二分、乱发二分烧、白鱼二分，杵为散，饮服方寸匕，日三服）'
  },
  {
    name: 'fuling_rongyan_tang',
    title: '茯苓戎盐汤',
    kind: 'formula',
    comment: CH13 + '：小便不利……茯苓戎盐汤并主之。',
    needs: [
      // 小便不利 + 不渴（脾虚湿停，与栝蒌瞿麦丸的「渴」正好相反）
      ['urination_difficulty.yes', 'thirsty.no'],
      ['urination_difficulty.yes', 'body_heavy.yes']
    ],
    contraindications: [
      '与蒲灰散、滑石白鱼散并列，同治小便不利，但偏「脾虚湿停」这一路',
      '三味：茯苓（利水健脾）、白术（燥湿健脾）、戎盐（即青盐，咸味软坚引水下行）',
      '和栝蒌瞿麦丸的鉴别：**本方不渴**（湿停而无燥热）；栝蒌瞿麦丸是「其人若渴」',
      '原文服法是「先将茯苓、白术煎成，入戎盐再煎，分温三服」'
    ],
    ref: CH13 + ' · 茯苓戎盐汤（茯苓半斤、白术二两、戎盐弹丸大一枚）'
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
for (const f of SUMMARIES.concat(FORMULAS)) if (registry[f.name]) errors.push(f.name + ' 已存在')
const willExist = new Set(
  NEW_SYMPTOMS.map(s => s.name)
    .concat(SUMMARIES.map(s => s.name))
    .concat(FORMULAS.map(f => f.name))
)
for (const f of SUMMARIES.concat(FORMULAS)) {
  for (const p1 of (f.needs || [])) for (const c of p1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !willExist.has(dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

console.log('=== 触发词查重（完全相同才报）===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      for (const other of kwsOf(registry[name])) {
        if (other === kw) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处' : '  没有完全相同的关键词 ✓')

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

// 给既有方剂追加路径（用整条路径文本判重，避免上一批「只查首条件」的 bug）
function appendPath(id, newPaths, note) {
  let f = null
  for (const d of ['formulas', 'syndromes']) {
    const p = path.join(PLUGINS, d, id + '.js')
    if (fs.existsSync(p)) { f = p; break }
  }
  if (!f) return '   ⚠ 找不到 ' + id
  let src = fs.readFileSync(f, 'utf8')
  const todo = newPaths.filter(p => {
    const sig = p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
    for (const m of src.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)) { /* noop */ }
    // 用「路径所有节点名都出现在同一条 needs 行」来判重
    for (const line of src.split('\n')) {
      if (!line.includes('[')) continue
      const names = [...line.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)].map(x => x[1]).sort().join('+')
      if (names === sig) return false
    }
    return true
  })
  if (!todo.length) return '   = ' + id + ' 已有所需路径'
  const lines = todo.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
  let out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\]\n\s*\})/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) return '   ⚠ ' + id + ' 没找到插入点'
  fs.writeFileSync(f, out, 'utf8')
  return '   ＋ ' + id + ' 追加 ' + todo.length + ' 条路径'
}

if (WRITE) {
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 症状 ' + s.name + '（' + s.title + '）')
  }
  for (const f of SUMMARIES) {
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 证候 ' + f.name + '（' + f.title + '）')
  }
  for (const f of FORMULAS) {
    fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 方剂 ' + f.name + '（' + f.title + '）')
  }

  console.log('\n=== 既有方剂追加路径 ===')
  console.log(appendPath('bawei_shenqi_wan',
    [['thirsty.yes', 'polyuria.yes']],
    '    // 金匮 13.4：男子消渴，小便反多，以饮一斗，小便一斗，肾气丸主之'))
  console.log(appendPath('wuling_san',
    [['urination_difficulty.yes', 'thirsty.yes'], ['water_reflux.yes']],
    '    // 金匮 13.5/13.6：脉浮小便不利微热消渴者五苓散主之；渴欲饮水，水入则吐者名水逆，五苓散主之'))
  console.log(appendPath('wenha_san',
    [['thirsty.yes', 'severe_thirst.yes']],
    '    // 金匮 13.7：渴欲饮水不止者，文蛤散主之'))
  console.log(appendPath('baihu_jia_renshen',
    [['thirsty.yes', 'throat_dry.yes', 'fever.yes']],
    '    // 金匮 13.13：渴欲饮水，口干舌燥者，白虎加人参汤主之'))
  console.log(appendPath('zhuling_tang',
    [['urination_difficulty.yes', 'thirsty.yes', 'fever.yes']],
    '    // 金匮 13.14：脉浮发热，渴欲饮水，小便不利者，猪苓汤主之'))

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + NEW_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂')
} else {
  for (const s of NEW_SYMPTOMS) console.log('\n症状 ' + s.name + '（' + s.title + '）｜' + s.ask)
  for (const s of SUMMARIES) {
    console.log('\n证候 ' + s.name + '（' + s.title + '）')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n方剂：')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(16) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
