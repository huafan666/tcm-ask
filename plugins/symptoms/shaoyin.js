module.exports = {
  name: 'shaoyin',
  title: '少阴',
  kind: 'symptom',
  trigger(text) { return ['少阴', '但欲寐', '昏昏欲睡', '脉微细', '瞑眩欲寐'].some(k => text.includes(k)) },
  negate(text) { return ['不少阴', '无少阴', '没有少阴', '未见少阴'].some(k => text.includes(k)) },
  ask: '是不是整个人没精神、老想睡，怎么睡都不够（但欲寐）？'
}
