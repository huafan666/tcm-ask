module.exports = {
  name: 'thirsty',
  title: '口渴',
  kind: 'symptom',
  trigger(text) { return ['口渴', '口干', '想喝水'].some(k => text.includes(k)) },
  negate(text) { return ['不渴', '口干不想喝'].some(k => text.includes(k)) },
  ask: '嘴里觉得干吗？一直想喝水、喝很多还是喝一点就够？'
}
