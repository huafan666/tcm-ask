module.exports = {
  name: 'lower_back_cold',
  title: '腰部发冷',
  trigger(text) { return ['腰部发冷', '腰中冷', '腰冰凉', '腰以下冷', '腰冷得像泡在水里', '腰又冷又痛', '腰上像放了冰', '腰上一片冰凉', '腰发凉', '腰冷'].some(k => text.includes(k)) },
  negate(text) { return ['腰不冷'].some(k => text.includes(k)) },
  ask: '是不是腰部发凉发冷，像泡在冷水里一样？'
}
