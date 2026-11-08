module.exports = {
  name: 'diarrhea',
  title: '下利',
  kind: 'symptom',
  trigger(text) { return ['下利', '腹泻', '拉肚子', '泄泻', '大便溏'].some(k => text.includes(k)) },
  negate(text) { return ['不下利', '大便正常', '不拉'].some(k => text.includes(k)) },
  ask: '是不是最近在拉肚子、大便稀？'
}

