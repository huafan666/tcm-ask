module.exports = {
  name: 'cold_aversion',
  title: '恶寒',
  kind: 'symptom',
  trigger(text) { return ['恶寒', '怕冷', '发冷'].some(k => text.includes(k)) },
  negate(text) { return ['不怕冷', '不冷'].some(k => text.includes(k)) },
  ask: '是不是特别怕冷、想盖被子，多穿衣服也还是冷？'
}

