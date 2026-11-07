module.exports = {
  name: 'borborygmus',
  title: '腹中雷鸣',
  kind: 'symptom',
  trigger(text) { return ['腹中雷鸣', '肠鸣', '肚子咕噜噜响', '肠鸣音大'].some(k => text.includes(k)) },
  negate(text) { return ['肚子不响'].some(k => text.includes(k)) }
}

