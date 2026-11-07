module.exports = {
  name: 'belching',
  title: '噫气',
  kind: 'symptom',
  trigger(text) { return ['噫气', '嗳气', '老打嗝', '嗳气不除'].some(k => text.includes(k)) },
  negate(text) { return ['不打嗝'].some(k => text.includes(k)) }
}

