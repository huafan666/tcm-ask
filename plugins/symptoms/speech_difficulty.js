module.exports = {
  name: 'speech_difficulty',
  title: '语言难出',
  kind: 'symptom',
  trigger(text) { return ['语言难出', '说话困难', '吐字难', '言语不清'].some(k => text.includes(k)) },
  negate(text) { return ['说话流利', '能说话'].some(k => text.includes(k)) }
}
