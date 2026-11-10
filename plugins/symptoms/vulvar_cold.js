module.exports = {
  name: 'vulvar_cold',
  title: '阴部发冷',
  trigger(text) { return ['阴部发冷', '阴中冷', '下面发凉', '阴道里发冷', '阴部冰凉'].some(k => text.includes(k)) },
  negate(text) { return ['阴部不冷'].some(k => text.includes(k)) },
  ask: '是不是阴部（阴道里）发凉、发冷？'
}
