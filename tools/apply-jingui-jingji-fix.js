'use strict'
// tools/apply-jingui-jingji-fix.js —— 批 18 修订
//
// 1. 黄土汤原来的 needs 是 ['wei_tong.yes']（胃痛），跟金匮 16.15 的「远血」完全不对应，
//    改成「先便后血」为主，胃痛那条保留为附带路径。
// 2. heart_palp 认不出「心跳不安」「心口窝跳动」这类说法。
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const HUANGTU = {
  name: 'huangtu_tang',
  title: '黄土汤',
  kind: 'formula',
  comment: '金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：下血，先便后血，此远血也，黄土汤主之。',
  needs: [
    // 远血：先大便、后出血（出血部位在上、离肛门远）
    ['blood_after_stool.yes'],
    ['stool_blood.yes', 'blood_after_stool.yes'],
    // 虚寒性下血：血色淡 + 面色差 / 四肢凉
    ['stool_blood.yes', 'poor_complexion.yes'],
    ['stool_blood.yes', 'cold_extremities.yes']
  ],
  contraindications: [
    '治「远血」：先拉大便、之后才出血（说明出血部位靠上、离肛门远），多见于胃与十二指肠出血',
    '黄土（灶心土）温中涩血为君，配白术、附子温阳健脾，地黄、阿胶养血止血，黄芩反佐以防温燥',
    '寒热并用、温涩为主——适合**虚寒性**下血：血色暗淡、面白乏力、四肢不温',
    '与赤小豆当归散的区别：那条是「近血」（先血后便、出血部位靠下），偏湿热；本方是远血、偏虚寒',
    '⚠ 黑便、便血先要排除消化道大出血与肿瘤，及时就医；出血量大时不可只靠中药'
  ],
  ref: '金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：下血，先便后血，此远血也，黄土汤主之（甘草、干地黄、白术、附子、阿胶、黄芩各三两，灶中黄土半斤）'
}

const HEART_ADD = ['心跳不安', '心口窝跳动', '心跳', '心跳乱', '心砰砰跳', '心里发跳']

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

for (const p of HUANGTU.needs) for (const c of p) {
  const dep = String(c).split('.')[0]
  if (!registry[dep]) { console.log('❌ 引用不存在的 ' + dep); process.exit(1) }
}

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

if (WRITE) {
  fs.writeFileSync(path.join(PLUGINS, 'formulas', 'huangtu_tang.js'), render(HUANGTU), 'utf8')
  console.log('  ~ huangtu_tang 改为 4 条路径（远血为主）')

  const hp = path.join(PLUGINS, 'symptoms', 'heart_palp.js')
  let src = fs.readFileSync(hp, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = HEART_ADD.filter(k => !existing.includes(k))
  if (fresh.length) {
    src = src.replace(m[0], '[' + existing.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
    fs.writeFileSync(hp, src, 'utf8')
    console.log('  ＋ heart_palp 补 ' + fresh.join('、'))
  }
  console.log('\n完成')
} else {
  console.log('huangtu_tang = ' + JSON.stringify(HUANGTU.needs))
  console.log('heart_palp 补 ' + HEART_ADD.join('、'))
}
