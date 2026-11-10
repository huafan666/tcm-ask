'use strict'
// tools/add-symptom-group-ui.js —— 给 dev 前端补 symptom_group 类型的支持
//
// 需要覆盖的点：
//   · KIND_LABEL / KIND_ORDER（app.js、inspector.js、panels.js）→ 标签显示「症状筛选」
//   · isLeaf 判断（store.js、app.js、inspector.js）→ 组和症状一样是叶子（有 trigger/ask）
//   · store.js 的布局列 col → 组单独一列，画布上不和症状挤在一起
//   · 顶部统计（app.js）→ 加一项「症状筛选」
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PUB = path.join(ROOT, 'dev', 'public', 'js')
const WRITE = process.argv.includes('--write')

const OLD_LABEL = "const KIND_LABEL = { symptom: '症状', pulse: '脉象', summary: '证候', formula: '方剂' }"
const NEW_LABEL = "const KIND_LABEL = { symptom: '症状', symptom_group: '症状筛选', pulse: '脉象', summary: '证候', formula: '方剂' }"
const OLD_ORDER = "const KIND_ORDER = ['symptom', 'pulse', 'summary', 'formula']"
const NEW_ORDER = "const KIND_ORDER = ['symptom_group', 'symptom', 'pulse', 'summary', 'formula']"

const EDITS = [
  // ---- app.js ----
  {
    file: path.join(PUB, 'app.js'),
    reps: [
      [OLD_LABEL, NEW_LABEL],
      [OLD_ORDER, NEW_ORDER],
      // 新建节点时的默认种类推断：组不参与推断，保持原逻辑
      ["const isLeaf = kind === 'symptom' || kind === 'pulse'",
        "const isLeaf = kind === 'symptom' || kind === 'symptom_group' || kind === 'pulse'"],
      // 顶部统计加一项
      ['<span class="mono">症状 ${(st.byKind && st.byKind.symptom) || 0}</span>',
        '<span class="mono">症状 ${(st.byKind && st.byKind.symptom) || 0}</span>\n        <span class="mono">症状筛选 ${(st.byKind && st.byKind.symptom_group) || 0}</span>']
    ]
  },
  // ---- inspector.js ----
  {
    file: path.join(PUB, 'inspector.js'),
    reps: [
      [OLD_LABEL, NEW_LABEL],
      [OLD_ORDER, NEW_ORDER],
      ["isLeaf: (k === 'symptom' || k === 'pulse')",
        "isLeaf: (k === 'symptom' || k === 'symptom_group' || k === 'pulse')"]
    ]
  },
  // ---- panels.js ----
  {
    file: path.join(PUB, 'panels.js'),
    reps: [[OLD_LABEL, NEW_LABEL]]
  },
  // ---- store.js ----
  {
    file: path.join(PUB, 'store.js'),
    reps: [
      ["isLeaf: spec.kind === 'symptom' || spec.kind === 'pulse',",
        "isLeaf: spec.kind === 'symptom' || spec.kind === 'symptom_group' || spec.kind === 'pulse',"],
      // 布局列：症状筛选组放到最左一列（-1），其余后移保持相对顺序
      ['const col = { symptom: 0, pulse: 0, summary: 1, formula: 2 }[n.kind] || 0',
        'const col = { symptom_group: -1, symptom: 0, pulse: 0, summary: 1, formula: 2 }[n.kind] ?? 0']
    ]
  }
]

let total = 0
for (const e of EDITS) {
  if (!fs.existsSync(e.file)) { console.log('⚠ 缺文件 ' + e.file); continue }
  let src = fs.readFileSync(e.file, 'utf8')
  const name = path.basename(e.file)
  for (const [a, b] of e.reps) {
    if (src.includes(b)) { console.log('  = ' + name + ' 已包含（跳过）'); continue }
    if (!src.includes(a)) { console.log('  ⚠ ' + name + ' 未匹配: ' + a.slice(0, 60)); continue }
    src = src.split(a).join(b)
    total++
    console.log('  ~ ' + name + ' ← ' + b.split('\n')[0].slice(0, 70))
  }
  if (WRITE) fs.writeFileSync(e.file, src, 'utf8')
}
console.log('\n共 ' + total + ' 处改动' + (WRITE ? '（已写入）' : '（预览）'))
