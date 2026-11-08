'use strict'
// tools/apply-jingui-2-7.js
// 落库金匮 2.7 痉病（按病机分组的三元组 + 节点原子化）
//
//   node tools/apply-jingui-2-7.js            # 预览 + 查重报告
//   node tools/apply-jingui-2-7.js --write    # 写盘
//
// 设计依据（用户原则）：
//   · 节点原子化：不建「身热足寒」这种组合节点，拆成身热(fever)+足寒(cold_extremities 加触发词)
//   · 同义即同节点：一个症状一个节点，同义词全塞进 trigger
//   · 三元组按病机分组，不按"体征好凑"分组
//
// 痉病病机（金匮要略·痉湿暍病脉证并治第二）：
//   外邪伤筋、津血不足 → 筋脉失养而拘急，故项背强急、口噤、背反张。
//   刚痉=表实无汗恶寒，柔痉=表虚汗出恶寒。误汗则津液更伤、筋脉更急。

const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const SHL_REF = '金匮要略·痉湿暍病脉证并治第二 · 病者身热足寒，颈项强急，恶寒，时头热，面赤，目赤，独头动摇，卒口噤，背反张者，痉病也'

// ---------- 1. 新建的原子症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'kou_jin',
    title: '口噤',
    kind: 'symptom',
    comment: SHL_REF,
    trigger: ['口噤', '牙关紧闭', '口不能开', '牙关咬紧', '嘴张不开', '牙关发紧'],
    negate: ['口不噤', '牙关能张', '嘴张得开'],
    ask: '是不是嘴巴张不开、牙关咬得紧紧的，话都说不利索？'
  },
  {
    name: 'bei_fan_zhang',
    title: '背反张',
    kind: 'symptom',
    comment: SHL_REF,
    trigger: ['背反张', '角弓反张', '项背反张', '身子往后反弓', '后背反张', '往后弓', '腰背反张', '身子往后仰'],
    negate: ['背不反张', '身子能弯'],
    ask: '是不是后背和脖子僵得整个人往后弓，像拉开的弓一样？'
  },
  {
    name: 'du_tou_dong_yao',
    title: '独头动摇',
    kind: 'symptom',
    comment: SHL_REF,
    // 说几个典型说法即可，不追求穷举；漏掉的靠反问补
    trigger: ['独头动摇', '头不停摇晃', '头自己晃', '头一直晃', '头不由自主地摇'],
    negate: ['头不摇', '头不晃'],
    ask: '是不是头会自己不停地摇晃，旁边人都看得出你在晃头？'
  },
  {
    name: 'mian_chi',
    title: '面赤',
    kind: 'symptom',
    comment: SHL_REF,
    trigger: ['面赤', '面色赤', '脸发红', '脸红', '满面通红'],
    negate: ['面不红', '脸不红', '脸色不红'],
    ask: '是不是脸发红、发烫？'
  },
  {
    name: 'mu_chi',
    title: '目赤',
    kind: 'symptom',
    comment: SHL_REF,
    trigger: ['目赤', '白睛发红', '白睛红', '眼睛发红', '眼睛红', '两眼发红'],
    negate: ['眼不红', '眼睛不红'],
    ask: '是不是眼睛发红、连眼白也红？'
  }
]

// ---------- 2. 已有节点的改动 ----------
const PATCHES = [
  {
    name: 'cold_extremities',
    // 足寒 = 脚冷，和"手足逆冷"本质是同一件事（同义即同节点）
    trigger: ['手足逆冷', '手脚冰冷', '四肢厥冷', '手冷脚冷', '四肢逆冷', '手脚发凉', '手足寒', '厥', '手一直冷', '手冷', '足寒', '两足冷', '脚凉']
  },
  {
    name: 'inner_cold_outer_heat',
    // 把"面赤/面色赤/脸发红"让给原子节点 mian_chi；这个是"证"，靠证名与"身反不恶寒"触发
    trigger: ['里寒外热', '身反不恶寒', '真寒假热']
  },
  {
    name: 'neck_stiff_pain',
    // 补口语说法：病人不会说"颈项强痛"，会说"脖子发硬"
    trigger: ['颈项强痛', '头项强痛', '项背强', '项背强几几', '脖子硬', '脖子僵硬', '颈背强',
      '后颈背发硬', '上半部发僵', '脖子和背发僵', '脖子发硬', '后脖子发硬', '项背发硬', '身体强几几', '几几然']
  }
]

// ---------- 3. 证候：三条三元组按病机分组 ----------
// ⚠ 关键约束：engine 的语义是「只要有一条路径被某条件明确否定，整个节点判 no」。
// 所以三条路径之间**不能出现 y.yes 与 y.no 这种互斥条件**（否则病人一否认就全盘否死）。
// 汗之有无属于刚痉/柔痉的分流条件，已由 gang_jing / rou_jing 两个证候承担，这里不碰。
const SUMMARY = {
  name: 'jing_bing',
  title: '痉病',
  kind: 'summary',
  comment: SHL_REF,
  needs: [
    // ① 外邪伤筋、筋脉拘急及于项背而内及于口 → 颈项强急 + 背反张 + 口噤
    ['neck_stiff_pain.yes', 'bei_fan_zhang.yes', 'kou_jin.yes'],
    // ② 津血亏虚、虚风内动 → 颈项强急 + 背反张 + 独头动摇
    ['neck_stiff_pain.yes', 'bei_fan_zhang.yes', 'du_tou_dong_yao.yes'],
    // ③ 虚阳上浮于头面、阳气不能温达于下 → 面赤 + 目赤 + 足寒（上赤下寒）
    ['mian_chi.yes', 'mu_chi.yes', 'cold_extremities.yes']
  ],
  contraindications: [
    '病机：外邪伤筋、津血不足，筋脉失养而拘急，故项背强急、口噤、背反张、独头动摇',
    '汗之有无用于分流：表实无汗恶寒=刚痉，表虚汗出而不恶寒=柔痉（两者另建证候）',
    '痉病忌误汗：若发其汗，寒湿相得，其表益虚，恶寒更甚',
    '本条原文未出方：痉病有汗者主栝蒌桂枝汤，欲作刚痉者主葛根汤（待后续批次落库）'
  ]
}

// ---------- 依赖与冲突检查 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

function kwsOf(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}

const FORCE = process.argv.includes('--force')
const errors = []
for (const n of NEW_SYMPTOMS.concat([SUMMARY])) {
  if (registry[n.name] && !FORCE) errors.push(`${n.name} 已存在，不能重复创建（要覆盖加 --force）`)
  for (const p of (n.needs || [])) {
    for (const c of p) {
      const dep = String(c).split('.')[0]
      if (!registry[dep] && !NEW_SYMPTOMS.some(s => s.name === dep)) errors.push(`${n.name} 引用了不存在的节点 ${dep}`)
    }
  }
}
if (errors.length) {
  console.log('校验失败：\n  ' + errors.join('\n  '))
  process.exit(1)
}

// 触发词撞车检查：新建节点的关键词，不能已经是别的节点的触发词
// （对本次要改 trigger 的节点，用改完之后的关键词表来比，否则必然报自己造成的重叠）
const patchedKws = {}
for (const p of PATCHES) patchedKws[p.name] = p.trigger

console.log('=== 触发词查重 ===')
let collided = 0
for (const s of NEW_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      if (name === s.name) continue
      const others = patchedKws[name] || kwsOf(registry[name])
      for (const other of others) {
        if (other === kw || other.includes(kw) || kw.includes(other)) {
          console.log(`  ⚠ 「${kw}」(${s.name}) 与 ${name} 的「${other}」重叠`)
          collided++
        }
      }
    }
  }
}
console.log(collided ? `  共 ${collided} 处重叠（需人工判断是否收窄）` : '  没有撞车 ✓')

// ---------- 生成源码 ----------
function render(model) {
  const m = Object.assign({}, model, {
    needs: (model.needs || []).map(p => p.map(P.condToRef))
  })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  for (const s of NEW_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
  }
  fs.writeFileSync(path.join(PLUGINS, 'syndromes', SUMMARY.name + '.js'), render(SUMMARY), 'utf8')

  for (const p of PATCHES) {
    const dir = registry[p.name].dir
    const abs = path.join(PLUGINS, dir, registry[p.name].file)
    const before = fs.readFileSync(abs, 'utf8')
    const r = P.patchPluginSource(before, { trigger: p.trigger })
    if (r.changed) {
      fs.writeFileSync(abs, r.text, 'utf8')
      console.log(`  ✎ 已改 ${p.name}: trigger 关键词 ${p.trigger.length} 个`)
    } else {
      console.log(`  · ${p.name} 无需改动`)
    }
    for (const n of r.notes) console.log('    note: ' + n)
  }

  // provenance
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of NEW_SYMPTOMS.concat([SUMMARY])) {
    prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原方', refs: [SHL_REF], by: 'system:jinkui' }
  }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入 5 个症状 + 1 个证候 + 2 个节点改动 + provenance')
} else {
  for (const s of NEW_SYMPTOMS) {
    console.log('\n=== plugins/symptoms/' + s.name + '.js ===')
    console.log(render(s))
  }
  console.log('\n=== plugins/syndromes/jing_bing.js ===')
  console.log(render(SUMMARY))
  console.log('（预览，未写盘。加 --write 落库）')
}
