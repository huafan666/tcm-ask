'use strict'
// tools/apply-jingui-2-1-2-2.js
// 落库金匮 2.1 刚痉 + 2.2 柔痉（只建两个 summary，不新建任何症状节点）
// 用 dev/lib/parse.js 的生成器写文件，保证能被开发端读回、且 selftest 的无损回写仍然成立。
//
//   node tools/apply-jingui-2-1-2-2.js            # 预览
//   node tools/apply-jingui-2-1-2-2.js --write    # 写盘

const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const NODES = [
  {
    name: 'gang_jing',
    title: '刚痉',
    kind: 'summary',
    comment: '金匮要略·痉湿暍病脉证并治第二：太阳病，发热无汗，反恶寒者，名曰刚痉。',
    needs: [['fever.yes', 'no_sweat.yes', 'cold_aversion.yes']],
    contraindications: [
      '太阳病发热无汗反恶寒者，名曰刚痉',
      '与柔痉只差有汗无汗与恶寒与否：有汗不恶寒者为柔痉',
      '痉病误汗则表益虚（身热足寒、口噤、背反张者尤忌发汗）'
    ],
    ref: '金匮要略·痉湿暍病脉证并治第二 · 太阳病，发热无汗，反恶寒者，名曰刚痉'
  },
  {
    name: 'rou_jing',
    title: '柔痉',
    kind: 'summary',
    comment: '金匮要略·痉湿暍病脉证并治第二：太阳病，发热汗出，而不恶寒，名曰柔痉。',
    needs: [['fever.yes', 'sweat.yes', 'cold_aversion.no']],
    contraindications: [
      '太阳病发热汗出而不恶寒者，名曰柔痉',
      '主方栝蒌桂枝汤（桂枝汤加栝蒌根），本条方剂待批 2 落库',
      '痉病误汗则表益虚'
    ],
    ref: '金匮要略·痉湿暍病脉证并治第二 · 太阳病，发热汗出，而不恶寒，名曰柔痉'
  }
]

// ---- 校验依赖节点都存在（避免悬空引用）----
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
const errors = []
for (const n of NODES) {
  for (const p of n.needs) {
    for (const c of p) {
      const dep = String(c).split('.')[0]
      if (!registry[dep]) errors.push(`${n.name} 引用了不存在的节点 ${dep}`)
    }
  }
  if (registry[n.name]) errors.push(`${n.name} 已存在，不能重复创建`)
}
if (errors.length) {
  console.log('校验失败：\n  ' + errors.join('\n  '))
  process.exit(1)
}

for (const n of NODES) {
  // generatePluginSource 的 needs 要的是 [{ref, pol}] 结构（不是 'x.yes' 字符串）
  const model = Object.assign({}, n, {
    needs: n.needs.map(path => path.map(P.condToRef))
  })
  const src = P.generatePluginSource(model)
  // 把条文出处作为注释插到 needs 前面（开发端回写会保留注释）
  const withComment = src.replace('  needs:', '  // ' + n.comment + '\n  needs:')
  console.log('\n=== plugins/syndromes/' + n.name + '.js ===')
  console.log(withComment)
  if (WRITE) {
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', n.name + '.js'), withComment, 'utf8')
  }
}

// ---- provenance：金匮来源 + 两条引用 ----
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
prov.sources = prov.sources || {}
prov.sources.jinkui = prov.sources.jinkui || {
  label: '金匮要略原方',
  title: '金匮要略',
  fullTitle: '伤寒杂病论 · 杂病部分',
  author: '张仲景',
  dynasty: '东汉',
  textFile: 'data/texts/金匮要略-wikisource.wikitext',
  textSource: 'zh.wikisource pageid 25028（繁体原文，已按 data/texts/繁简对照.json 转简体）',
  note: '引用用「篇名 + 条文首句」，可直接检索；不冒充教材条号'
}
prov.nodes = prov.nodes || {}
for (const n of NODES) {
  prov.nodes[n.name] = {
    source: 'jinkui',
    label: '金匮要略原方',
    refs: [n.ref],
    by: 'system:jinkui'
  }
}
console.log('\nprovenance: 新增 source=jinkui 与 ' + NODES.map(n => n.name).join('、'))

if (WRITE) {
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入 2 个 summary + provenance.json')
} else {
  console.log('\n（预览，未写盘。加 --write 落库）')
}
