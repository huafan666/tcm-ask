'use strict'
// tools/apply-jingui-3-7.js —— 补金匮 3.7：栝楼牡蛎散（批 4 漏掉的一条）
//
// 原文：百合病，渴不差者，用后方主之。栝楼牡蛎散方：栝楼根、牡蛎等分，为细末，饮服方寸匕，日三服。
// 批 4 只处理了 3.2~3.6 和 3.8，3.7 因为原文没写方名（只写「用后方主之」）被跳过。
//
// 与 3.6 百合洗方的分工（原文是先后两步，不是二选一）：
//   3.6「一月不解，变成渴」= 刚变渴 → 外洗透邪
//   3.7「渴不差」           = 渴得厉害、外洗已不管用 → 内服生津
// 引擎没法记「洗过没效」，所以用「渴的程度」作代理：渴得厉害（大烦渴）才推荐栝楼牡蛎散。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH3 = '金匮要略·百合病狐惑阴阳毒病证并治第三'

const F = {
  name: 'gualou_muli_san',
  title: '栝楼牡蛎散',
  kind: 'formula',
  comment: CH3 + '：百合病，渴不差者，用后方主之（栝楼牡蛎散）。',
  // 百合病 + 渴得厉害（大烦渴）：说明前一步百合洗方已经不管用，要内服生津
  needs: [['baihe_bing.yes', 'thirsty.yes', 'severe_thirst.yes']],
  contraindications: [
    '百合病口渴一直不好、喝很多水也不解，用百合洗方也没解决，就换这个内服',
    '栝楼根（天花粉）生津止渴，牡蛎咸寒潜降、把浮上去的热往下收',
    '两味等分为末，每次一小勺（方寸匕）用水送服，一天三次',
    '和百合洗方（3.6）是先后两步：3.6 是刚变渴、走外洗透邪；本条是渴得厉害、津伤已深，必须内服生津'
  ],
  ref: CH3 + ' · 百合病，渴不差者，用后方主之 · 栝楼牡蛎散方（栝楼根、牡蛎等分，为细末，饮服方寸匕，日三服）'
}

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

const exists = !!registry[F.name]
for (const p of F.needs) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的节点 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  fs.writeFileSync(path.join(PLUGINS, 'formulas', F.name + '.js'), render(F), 'utf8')
  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  prov.nodes[F.name] = { source: 'jinkui', label: '金匮要略原文', refs: [F.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log((exists ? '  ~ 更新 ' : '  ＋ 新增 ') + F.name + '（' + F.title + '）needs=' + JSON.stringify(F.needs))
} else {
  console.log((exists ? '（已存在，将更新）' : '（新增）') + F.title + ' needs=' + JSON.stringify(F.needs))
  console.log('（预览，加 --write 落库）')
}
