module.exports = {
  name: 'wind_aversion',
  title: '恶风',
  kind: 'symptom',
  trigger(text) { return ['恶风', '怕风'].some(k => text.includes(k)) },
  negate(text) { return ['不怕风', '不恶风'].some(k => text.includes(k)) },
  ask: '是不是一吹风就觉得难受、想躲开，没风的时候反而还好？'
}

