'use strict'
// tools/add-synonyms-fuman.js —— 批 12 口语变体补词
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins', 'symptoms')

const PATCHES = {
  abdominal_pain: ['一按就痛', '按着痛', '按下去痛', '肚子疼', '腹部疼痛', '肚腹疼痛'],
  borborygmus: ['肚子咕噜响', '肚子咕咕叫', '腹中咕噜', '肠子咕噜响', '肚子里咕噜咕噜'],
  constipation: ['大便不通', '大便解不出', '解不出大便', '几天没大便', '大便秘结'],
  cold_sweat: ['冒冷汗', '一身冷汗', '冷汗', '疼得一身汗发凉'],
  abdominal_tension: ['肚子一阵阵发紧', '肚子发紧', '腹部发紧', '肚子绷着'],
  abdomen_bulging_mass: ['肚皮上鼓起一块', '腹部鼓起一块', '肚子鼓起个包', '肚子上鼓起东西',
    '腹部有包块会移动'],
  severe_abdominal_pain: ['痛得不敢碰', '疼得不敢碰', '碰都不敢碰', '疼得不能摸',
    '痛不可触近', '痛得打滚'],
  circumumbilical_pain: ['肚脐眼周围痛', '脐周痛', '绕着肚脐痛']
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
