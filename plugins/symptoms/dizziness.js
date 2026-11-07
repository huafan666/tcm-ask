module.exports = {
  name: 'dizziness',
  title: '头眩',
  kind: 'symptom',
  trigger(text) { return ['头眩', '头晕', '眩晕', '起则头眩'].some(k => text.includes(k)) },
  negate(text) { return ['不眩'].some(k => text.includes(k)) }
}

