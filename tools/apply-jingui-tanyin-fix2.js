'use strict'
// tools/apply-jingui-tanyin-fix2.js —— 批 14 修订
//
// 三个问题：
//   1. epigastric_pressing_pain 认不出「心口按着又满又痛」
//   2. diarrhea 认不出「拉完反而舒服」（甘遂半夏汤「利反快」的关键指征）
//   3. 泽泻汤原来挂 tan_yin.yes 当代理，但 tan_yin 要求「素盛今瘦+肠鸣」，
//      而泽泻汤治的是「苦冒眩」，不该被消瘦等条件卡住 → 改为直接挂眩晕的水饮搭档
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const SYN = {
  epigastric_pressing_pain: ['心口按着又满又痛', '心口按下又满又痛', '按下又满又痛',
    '心口按着满痛', '胃这块按下去满痛', '心口一按又胀又疼'],
  diarrhea: ['拉完反而舒服', '拉肚子后反而轻松', '泻后反而快然', '拉完觉得轻快']
}

const ZEXIE_NEEDS = [
  // 水饮上泛致「苦冒眩」：眩晕 + 肠间水声，或眩晕 + 心下痞
  ['dizziness.yes', 'borborygmus.yes'],
  ['dizziness.yes', 'epigastric_lump_soft.yes'],
  ['dizziness.yes', 'chest_qi_stuffiness.yes'],
  ['dizziness.yes', 'saliva_spit.yes']
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)
if (!registry.zexie_tang) { console.log('❌ 找不到 zexie_tang'); process.exit(1) }
for (const p of ZEXIE_NEEDS) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ zexie_tang 引用不存在的 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  for (const [file, add] of Object.entries(SYN)) {
    const p = path.join(PLUGINS, 'symptoms', file + '.js')
    let src = fs.readFileSync(p, 'utf8')
    const m = /\['([^\]]*)'\]\.some/.exec(src)
    const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
    const fresh = add.filter(k => !existing.includes(k))
    if (!fresh.length) { console.log('= ' + file + ' 无需补词'); continue }
    src = src.replace(m[0], '[' + existing.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
    fs.writeFileSync(p, src, 'utf8')
    console.log('  ＋ ' + file + ' 补 ' + fresh.join('、'))
  }

  const zf = path.join(PLUGINS, 'formulas', 'zexie_tang.js')
  const zsrc = fs.readFileSync(zf, 'utf8')
  const zcomment = (/^\/\/\s*(.+)$/m.exec(zsrc) || [, ''])[1]
  const zdef = registry.zexie_tang
  fs.writeFileSync(zf, render({
    name: 'zexie_tang', title: zdef.title, kind: 'formula', comment: zcomment,
    needs: ZEXIE_NEEDS,
    contraindications: (zdef.contraindications || []).concat([
      '本方以「苦冒眩」（眩晕得难受）为主证，不必等其他痰饮条件俱全'
    ])
  }), 'utf8')
  console.log('  ~ zexie_tang needs=' + JSON.stringify(ZEXIE_NEEDS))
  console.log('\n完成')
} else {
  for (const [k, v] of Object.entries(SYN)) console.log(k + ' 补 ' + v.join('、'))
  console.log('zexie_tang = ' + JSON.stringify(ZEXIE_NEEDS))
  console.log('（预览，加 --write 落库）')
}
