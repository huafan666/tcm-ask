module.exports = {
  name: 'yangming',
  title: '阳明',
  kind: 'symptom',
  trigger(text) { return ['阳明', '大便不通', '潮热'].some(k => text.includes(k)) },
  negate(text) { return ['不阳明', '无阳明', '没有阳明', '未及阳明', '未见阳明'].some(k => text.includes(k)) }
}
