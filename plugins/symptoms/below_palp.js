module.exports = {
  name: 'below_palp',
  title: '脐下悸',
  kind: 'symptom',
  trigger(text) { return ['脐下悸', '小腹跳', '肚脐下悸动', '下腹悸'].some(k => text.includes(k)) },
  negate(text) { return ['腹不悸'].some(k => text.includes(k)) }
}

