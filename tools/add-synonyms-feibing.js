'use strict'
// tools/add-synonyms-feibing.js —— 批 9 口语变体补词
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins', 'symptoms')

const PATCHES = {
  eye_bulging: ['眼睛像要脱出来', '眼睛像要掉出来', '眼睛胀得要脱出来', '喘得眼睛往外鼓',
    '眼睛鼓出来', '眼球突出得要掉'],
  qi_upward_cough: ['咳嗽气往上冲', '气往上冲', '气往上冲得厉害', '气一直往上顶',
    '咳得气往上涌', '气逆不降', '咳嗽气往上涌'],
  throat_rales: ['喉中水鸡叫', '水鸡声', '嗓子里有声', '喉咙里痰声呼噜'],
  orthopnea: ['躺不平气上来', '一躺就喘', '不能躺只能坐', '要坐起来喘'],
  foul_pus_sputum: ['痰腥臭', '吐腥臭痰', '咳出臭痰', '痰像米汤'],
  saliva_spit: ['吐清稀唾沫', '老吐口水', '口水多得吐不完'],
  urine_incontinence: ['尿失禁', '控制不住小便', '不知不觉尿了']
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
