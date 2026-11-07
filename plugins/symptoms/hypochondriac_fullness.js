module.exports = {
  name: 'hypochondriac_fullness',
  title: '胸胁苦满',
  kind: 'symptom',
  trigger(text) { return ['胸胁苦满', '胁下满', '胁肋胀满', '两肋胀', '胁下痞'].some(k => text.includes(k)) },
  negate(text) { return ['胁不胀'].some(k => text.includes(k)) }
}

