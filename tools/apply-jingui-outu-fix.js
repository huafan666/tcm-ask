'use strict'
// tools/apply-jingui-outu-fix.js —— 批 18 修订
//
// 1. 「入口即吐」与既有 vomit_on_intake 撞词，从新节点里去掉（保留含义更宽的既有节点）
// 2. 吴茱萸汤、大承气汤的 `],  contraindications:` 写在同一行，appendPath 的换行正则匹配不到，
//    这里用更宽松的插入方式补上金匮第十七篇的路径
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const WRITE = process.argv.includes('--write')

const DROP_KW = { vomit_right_after_eating: ['入口即吐'] }

const APPEND = [
  {
    id: 'wuzhuyu_tang',
    paths: [
      ['vomiting.yes', 'chest_fullness.yes'],
      ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes']
    ],
    note: '    // 金匮 17.10/17.11：呕而胸满者、干呕吐涎沫头痛者，茱萸汤主之'
  },
  {
    id: 'dachengqi_tang',
    paths: [['diarrhea.yes', 'epigastric_lump_soft.yes']],
    note: '    // 金匮 17.39：下利，三部脉皆平，按之心下坚者，急下之，宜大承气汤'
  }
]

const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

if (WRITE) {
  // 1. 去掉撞词的触发词
  for (const [file, kws] of Object.entries(DROP_KW)) {
    const p = path.join(PLUGINS, 'symptoms', file + '.js')
    let src = fs.readFileSync(p, 'utf8')
    const m = /\['([^\]]*)'\]\.some/.exec(src)
    const list = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1]).filter(k => !kws.includes(k))
    src = src.replace(m[0], '[' + list.map(k => "'" + k + "'").join(', ') + '].some')
    fs.writeFileSync(p, src, 'utf8')
    console.log('  － ' + file + ' 去掉撞词 ' + kws.join('、'))
  }

  // 2. 追加路径（兼容 `],  contraindications:` 同行写法）
  for (const job of APPEND) {
    const f = path.join(PLUGINS, 'formulas', job.id + '.js')
    if (!fs.existsSync(f)) { console.log('⚠ 找不到 ' + job.id); continue }
    let src = fs.readFileSync(f, 'utf8')
    const todo = job.paths.filter(p => {
      const sig = p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
      for (const line of src.split('\n')) {
        if (!line.includes('[')) continue
        const names = [...line.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)].map(x => x[1]).sort().join('+')
        if (names === sig) return false
      }
      return true
    })
    if (!todo.length) { console.log('  = ' + job.id + ' 已有'); continue }
    const lines = todo.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
    // 在 needs 数组的收尾 `]` 之前插入
    const out = src.replace(/\]\s*,\s*contraindications\s*:/, ',\n' + job.note + '\n' + lines + '\n  ],\n  contraindications:')
    if (out === src) { console.log('⚠ ' + job.id + ' 仍没找到插入点'); continue }
    fs.writeFileSync(f, out, 'utf8')
    console.log('  ＋ ' + job.id + ' 追加 ' + todo.length + ' 条路径')
  }
  console.log('\n完成')
} else {
  console.log('去掉撞词 ' + JSON.stringify(DROP_KW))
  for (const j of APPEND) console.log(j.id + ' 追加 ' + j.paths.length)
}
