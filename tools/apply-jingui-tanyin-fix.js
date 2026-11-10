'use strict'
// tools/apply-jingui-tanyin-fix.js —— 补苓桂术甘汤的金匮 12.17 路径
//
// 原先的 appendPath 守卫写得不对：只检查每条路径的第一个条件是否已存在，
// 而苓桂术甘汤本来就有 dizziness.yes（在「气上冲+起则头眩」那条里），
// 于是被误判成「已有相关路径」直接跳过了。
// 金匮 12.17 的实际条件是：胸胁支满 + 目眩，与原有两条都不同。
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const F = path.join(PLUGINS, 'formulas', 'linggui_shugan_tang.js')
const WRITE = process.argv.includes('--write')

let src = fs.readFileSync(F, 'utf8')
const marker = '金匮 12.17'
if (src.includes(marker)) {
  console.log('= 已有 12.17 路径，跳过')
  process.exit(0)
}

const insert = [
  ',',
  '    // 金匮 12.17：心下有痰饮，胸胁支满，目眩，苓桂术甘汤主之',
  "    ['hypochondriac_fullness.yes', 'dizziness.yes'],",
  "    ['dizziness.yes', 'epigastric_lump_soft.yes']"
].join('\n')

const out = src.replace(/(\n\s*\],\n\s*contraindications)/, insert + '$1')
if (out === src) { console.log('❌ 没找到插入点'); process.exit(1) }

if (WRITE) {
  fs.writeFileSync(F, out, 'utf8')
  console.log('  ＋ linggui_shugan_tang 追加 2 条路径（胸胁支满+目眩 / 目眩+心下痞）')
} else {
  console.log('将追加 2 条路径')
}
