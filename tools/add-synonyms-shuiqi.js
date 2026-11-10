'use strict'
// tools/add-synonyms-shuiqi.js —— 批 16 补词
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins', 'symptoms')

const PATCHES = {
  pitting_edema: ['全身面目肿', '面目肿', '全身肿', '浑身肿', '一身悉肿', '脸和身子都肿',
    '四肢肿', '身上水肿', '肿起来了'],
  muscle_twitching: ['肌肉一跳一跳', '肉一跳一跳', '身上一跳一跳', '肌肉突突跳',
    '肉在跳', '肌肉抽搐样跳'],
  waist_split_sweat: ['只有上半身出汗', '上半身有汗', '下身没汗'],
  yellow_sweat: ['汗是黄颜色的', '汗把衣服染黄了', '黄汗']
}

let n = 0
for (const [file, add] of Object.entries(PATCHES)) {
  const p = path.join(DIR, file + '.js')
  if (!fs.existsSync(p)) { console.log('⚠ 缺文件 ' + file); continue }
  let src = fs.readFileSync(p, 'utf8')
  const m = /\['([^\]]*)'\]\.some/.exec(src)
  if (!m) { console.log('⚠ 找不到关键词数组 ' + file); continue }
  const existing = [...m[0].matchAll(/'([^']*)'/g)].map(x => x[1])
  const fresh = add.filter(k => !existing.includes(k))
  if (!fresh.length) { console.log('= ' + file + ' 无需补词'); continue }
  src = src.replace(m[0], '[' + existing.concat(fresh).map(k => "'" + k + "'").join(', ') + '].some')
  fs.writeFileSync(p, src, 'utf8')
  console.log('+ ' + file + ' 补 ' + fresh.join('、'))
  n += fresh.length
}
console.log('\n共补 ' + n + ' 个触发词')
