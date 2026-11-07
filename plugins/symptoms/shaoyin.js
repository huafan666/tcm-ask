module.exports = {
  name: 'shaoyin',
  title: '少阴',
  kind: 'symptom',
  trigger(text) { return ['少阴', '但欲寐', '昏昏欲睡', '脉微细', '瞑眩欲寐'].some(k => text.includes(k)) },
  negate(text) { return ['不少阴', '无少阴', '没有少阴', '未见少阴'].some(k => text.includes(k)) },
  ask: '是不是精神萎靡老想睡、脉细弱(但欲寐)？这是少阴病标志。'
}
