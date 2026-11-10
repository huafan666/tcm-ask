'use strict'
// tools/add-synonyms-huyao.js —— 批 5 口语变体补词（只按完全相同去重）
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins', 'symptoms')

const PATCHES = {
  anal_ulcer: ['肛门也烂了', '肛门烂了', '肛门烂', '肛门破皮', '肛口烂', '屁股眼烂'],
  face_red_patches: ['一片片红斑', '脸上红斑成片', '红斑像花纹', '脸上起红斑', '面红斑斑'],
  body_pain: ['身上痛得像被棍子打过', '痛得像被打过', '像被棍子打过', '浑身像挨了打'],
  eyes_dark_rims: ['眼圈四周发黑', '眼眶四周发黑', '眼睛周围一圈黑', '眼圈一圈黑'],
  throat_dry: ['嗓子干得慌', '喉咙干得难受', '嗓子干得难受'],
  genital_ulcer: ['下身也烂了', '下面也烂了', '阴部也溃烂', '下身破皮'],
  voice_hoarse: ['声音沙哑', '嗓子变哑', '声音变得沙哑'],
  eyes_cannot_close: ['想闭眼却闭不上', '闭不上眼', '眼闭不拢']
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
  const merged = existing.concat(fresh).map(k => "'" + k + "'").join(', ')
  src = src.replace(m[0], '[' + merged + '].some')
  fs.writeFileSync(p, src, 'utf8')
  console.log('+ ' + file + ' 补 ' + fresh.join('、'))
  n += fresh.length
}
console.log('\n共补 ' + n + ' 个触发词')
