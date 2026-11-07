module.exports = {
  name: 'cold_aversion',
  title: '恶寒',
  kind: 'symptom',
  trigger(text) { return ['恶寒', '怕冷', '发冷'].some(k => text.includes(k)) },
  negate(text) { return ['不怕冷', '不冷'].some(k => text.includes(k)) },
  ask: '是不是怕冷、想盖被子？即使多穿/靠近热源仍觉得冷，叫恶寒；和怕风吹(恶风)不同。'
}

