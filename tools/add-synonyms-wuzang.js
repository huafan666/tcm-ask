'use strict'
// tools/add-synonyms-wuzang.js —— 批 13 补词
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins', 'symptoms')

const PATCHES = {
  fixed_mass: ['位置固定不动', '固定不动', '包块位置固定', '块一直在那儿不动',
    '摸着有个硬块不动', '固定的硬块'],
  desire_to_press_chest: ['想捶胸口才舒服', '胸口闷得想捶', '想压一压胸口'],
  lower_back_cold: ['腰上一片冰凉', '腰发凉', '腰冷'],
  migratory_pain: ['痛的地方老变', '一会儿这儿疼一会儿那儿疼', '疼痛跑来跑去']
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
