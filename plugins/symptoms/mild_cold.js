module.exports = {
  name: 'mild_cold',
  title: '微寒',
  kind: 'symptom',
  trigger(text) { return ['微寒', '稍怕冷', '轻度恶寒'].some(k => text.includes(k)) },
  negate(text) { return ['不怕冷'].some(k => text.includes(k)) }
}
