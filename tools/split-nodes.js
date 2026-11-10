'use strict'
// tools/split-nodes.js
// 把「两个独立症状挤在一个节点里」的拆成两个原子节点，并改好所有引用。
//
//   node tools/split-nodes.js            # 预览
//   node tools/split-nodes.js --write    # 写盘
//
// 拆四组：
//   1) chest_blockage 胸中窒、心中结痛   → chest_stuffy 胸中窒 | heart_bind_pain 心中结痛
//   2) body_shaking 身瞤动、振振欲辟地   → muscle_twitching 肌肉跳动 | unsteady_stance 站立不稳
//   3) listless_mute 提不起劲、不想说话  → low_energy 提不起劲 | mute_quiet 不想说话
//   4) body_aches_heavy 身疼重           → 删除，改用已有的 body_pain + body_heavy
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const CH = '金匮要略/伤寒论'

// 每组：旧节点 → 新节点（新节点带 trigger/negate/ask）
const SPLITS = [
  {
    from: 'chest_blockage',
    to: [
      {
        name: 'chest_stuffy',
        title: '胸中窒',
        comment: '伤寒论·第77条：发汗若下之而烦热，胸中窒者，栀子豉汤主之。',
        trigger: ['胸中窒', '胸中堵', '胸口发堵', '胸膈憋闷', '胸中憋'],
        negate: ['胸口不堵', '胸中不闷'],
        ask: '是不是觉得胸口里堵着一块，闷得慌但又不痛？'
      },
      {
        name: 'heart_bind_pain',
        title: '心中结痛',
        comment: '伤寒论·第78条：伤寒五六日，大下之后，身热不去，心中结痛者，未欲解也，栀子豉汤主之。',
        trigger: ['心中结痛', '心口一阵阵结着痛', '胸口绞痛'],
        negate: ['心口不痛'],
        ask: '是不是心口那里一阵阵地发紧、结着疼？'
      }
    ],
    // 引用该旧节点的方剂：拆开后两个新节点都加成 OR 路径（原文是两条不同的条文，各自都能定到该方）
    repoint: { 'zhizi_chi_tang': 'or' }
  },
  {
    from: 'body_shaking',
    to: [
      {
        name: 'muscle_twitching',
        title: '肌肉跳动',
        comment: '伤寒论·第82条：太阳病发汗，汗出不解，其人仍发热，心下悸，头眩，身瞤动，振振欲擗地者，真武汤主之。',
        trigger: ['肌肉跳动', '肉跳', '身上肉一跳一跳', '眼皮跳不停', '肌肉不自主地跳'],
        negate: ['肉不跳'],
        ask: '是不是身上的肉会自己一跳一跳，像眼皮跳那样停不下来？'
      },
      {
        name: 'unsteady_stance',
        title: '站立不稳',
        comment: '伤寒论·第82条：……身瞤动，振振欲擗地者，真武汤主之。',
        trigger: ['站立不稳', '站不住', '身子发晃', '走路发飘', '站不稳想倒下'],
        negate: ['站得稳'],
        ask: '是不是站着的时候身子发晃、站不稳，感觉要倒下去？'
      }
    ],
    repoint: { 'zhenwu_tang': 'or' }
  },
  {
    from: 'listless_mute',
    to: [
      {
        name: 'low_energy',
        title: '提不起劲',
        comment: '金匮要略·百合病：意欲食复不能食，常默默……欲行不能行。',
        trigger: ['提不起劲', '没精神', '蔫蔫的', '浑身没劲不想动', '懒得动'],
        negate: ['精神很好', '有劲'],
        ask: '是不是整天提不起劲、浑身没精神，就想躺着？'
      },
      {
        name: 'mute_quiet',
        title: '不想说话',
        comment: '金匮要略·百合病：常默默。',
        trigger: ['不想说话', '不爱说话', '沉默寡言', '懒得说话', '一句话都不想说'],
        negate: ['话很多', '愿意说话'],
        ask: '是不是不想开口说话，别人跟你说话也懒得答？'
      }
    ],
    repoint: { 'baihe_bing': 'and' }
  },
  {
    from: 'body_aches_heavy',
    // 没有新节点：直接用已有的 body_pain（身体疼痛）+ body_heavy（身重）
    to: [],
    repoint: { 'yiwu_guadi_tang': 'replace-with:body_pain,body_heavy' }
  }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  const src = P.generatePluginSource(m)
  return src.replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

// 预览改动
console.log('=== 拆分计划 ===')
for (const g of SPLITS) {
  const old = registry[g.from]
  console.log('\n' + g.from + '（' + (old ? old.title : '不存在') + '）')
  for (const n of g.to) console.log('   → 新建 ' + n.name + '（' + n.title + '）')
  if (!g.to.length) console.log('   → 不新建，改用已有节点 ' + Object.values(g.repoint)[0])
  for (const [owner, mode] of Object.entries(g.repoint)) {
    const def = registry[owner]
    console.log('   引用方 ' + owner + '（' + (def ? def.title : '不存在') + '）：' + mode)
  }
}

if (WRITE) {
  for (const g of SPLITS) {
    // 1) 新建拆出来的节点
    for (const n of g.to) {
      if (registry[n.name]) { console.log('· ' + n.name + ' 已存在，跳过新建'); continue }
      const dir = 'symptoms'
      fs.writeFileSync(path.join(PLUGINS, dir, n.name + '.js'), render(n), 'utf8')
      console.log('  ＋ ' + n.name + '（' + n.title + '）')
    }
    // 2) 改引用方
    for (const [owner, mode] of Object.entries(g.repoint)) {
      const def = registry[owner]
      if (!def) continue
      const abs = path.join(PLUGINS, def.dir, def.file)
      const before = fs.readFileSync(abs, 'utf8')
      const cur = P.scanPluginSource(before).model
      let needs = cur.needs.map(x => x.slice())
      if (mode === 'or') {
        // 旧节点在几条路径里，就展开成几条：把该 ref 替换成新节点，逐个复制路径
        const expanded = []
        for (const path1 of needs) {
          const has = path1.some(c => c.ref === g.from)
          if (!has) { expanded.push(path1); continue }
          for (const n of g.to) expanded.push(path1.map(c => c.ref === g.from ? { ref: n.name, pol: c.pol } : c))
        }
        needs = expanded
      } else if (mode === 'and') {
        // 旧节点原本是一个 AND 要素（如百合病路径 1），拆成两个都要求
        const expanded = []
        for (const path1 of needs) {
          const has = path1.some(c => c.ref === g.from)
          if (!has) { expanded.push(path1); continue }
          const base = path1.filter(c => c.ref !== g.from)
          expanded.push(base.concat(g.to.map(n => ({ ref: n.name, pol: 'yes' }))))
        }
        needs = expanded
      } else if (mode.startsWith('replace-with:')) {
        const repl = mode.split(':')[1].split(',')
        needs = needs.map(path1 => {
          const out = []
          for (const c of path1) {
            if (c.ref === g.from) { for (const r of repl) out.push({ ref: r, pol: c.pol }) }
            else out.push(c)
          }
          return out
        })
      }
      const r = P.patchPluginSource(before, { needs })
      if (r.changed) { fs.writeFileSync(abs, r.text, 'utf8'); console.log('  ✎ ' + owner + ' 引用已改指') }
      for (const nt of r.notes) console.log('    note: ' + nt)
    }
    // 3) 删掉旧节点
    if (registry[g.from]) {
      const old = registry[g.from]
      fs.unlinkSync(path.join(PLUGINS, old.dir, old.file))
      console.log('  − 删除旧节点 ' + g.from)
    }
  }
  // 4) provenance：新节点继承旧节点的出处；删掉旧条目
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const g of SPLITS) {
    const oldProv = prov.nodes[g.from]
    for (const n of g.to) {
      prov.nodes[n.name] = oldProv
        ? Object.assign({}, oldProv, { refs: [n.comment] })
        : { source: 'shanghanlun', label: '伤寒论原方', refs: [n.comment], by: 'system:shanghanlun' }
    }
    delete prov.nodes[g.from]
  }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：拆分 + 改引用 + provenance')
} else {
  console.log('\n（预览，加 --write 执行）')
}
