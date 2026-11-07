module.exports = {
  name: 'wind_aversion',
  title: '恶风',
  kind: 'symptom',
  trigger(text) { return ['恶风', '怕风'].some(k => text.includes(k)) },
  negate(text) { return ['不怕风', '不恶风'].some(k => text.includes(k)) },
  ask: '是不是怕风吹？可以想象被风扇吹着试试——被吹到就觉得难受、想躲开，叫恶风；无风时反而还好。'
}

