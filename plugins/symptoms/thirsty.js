module.exports = {
  name: 'thirsty',
  title: '口渴',
  kind: 'symptom',
  trigger(text) { return ['口渴', '口干', '想喝水'].some(k => text.includes(k)) },
  negate(text) { return ['不渴', '口干不想喝'].some(k => text.includes(k)) },
  ask: '是不是嘴里发干、老想喝水？'
}
