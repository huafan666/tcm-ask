module.exports = {
  name: 'shaoyang',
  title: '少阳',
  kind: 'symptom',
  trigger(text) { return ['少阳', '口苦', '往来寒热', '胸胁苦满'].some(k => text.includes(k)) },
  negate(text) { return ['不少阳', '无少阳', '没有少阳', '未及少阳', '未见少阳'].some(k => text.includes(k)) },
  ask: '是不是有口苦、嗓子干、眼睛发花，还一阵冷一阵热（少阳）？'
}
