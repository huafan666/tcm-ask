'use strict'
// tools/add-headache.js —— 补「头痛」节点
//
// 库里原来居然没有头痛节点，而头痛是极常见症状：
//   金匮 17.11「干呕吐涎沫，头痛者，茱萸汤主之」
//   伤寒论：太阳病「头项强痛」、少阳「头痛发热」、厥阴「巅顶痛」都用到
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')

const N = {
  name: 'headache',
  title: '头痛',
  kind: 'symptom',
  comment: '头痛（各部位都算）。金匮 17.11「干呕吐涎沫，头痛者，茱萸汤主之」；伤寒太阳病头项强痛、少阳头痛、厥阴巅顶痛均用得到。',
  trigger: ['头痛', '头疼', '脑袋疼', '头胀痛', '偏头痛', '后脑勺痛', '太阳穴痛',
    '头顶痛', '头一阵阵地痛', '头痛得厉害'],
  negate: ['头不痛', '头不疼', '没有头痛'],
  ask: '是不是头痛？（哪个部位都算）'
}

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
if (registry.headache) { console.log('= headache 已存在'); process.exit(0) }
// 查重：别和「头晕」混
for (const k of N.trigger) {
  for (const [id, d] of Object.entries(registry)) {
    if (d.kind !== 'symptom' || typeof d.trigger !== 'function') continue
    const m = /\[([\s\S]*?)\]/.exec(d.trigger.toString())
    if (!m) continue
    const kws = [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2])
    if (kws.includes(k)) console.log('  ⚠ 触发词「' + k + '」与 ' + id + ' 重复')
  }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (!WRITE) { console.log('将新建 headache 头痛'); process.exit(0) }
fs.writeFileSync(path.join(PLUGINS, 'symptoms', 'headache.js'), render(N), 'utf8')
const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
prov.nodes.headache = {
  source: 'jinkui', label: '金匮要略第十七篇 + 伤寒论各篇',
  refs: ['金匮要略·呕吐哕下利病脉证并治第十七：干呕吐涎沫，头痛者，茱萸汤主之'],
  by: 'system:jinkui'
}
fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
console.log('  ＋ 症状 headache（头痛）')
