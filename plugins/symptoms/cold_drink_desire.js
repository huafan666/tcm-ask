module.exports = {
  name: 'cold_drink_desire',
  title: '喜冷饮/吃冰',
  kind: 'symptom',
  trigger(text) { return ['喜冷饮', '喜欢喝冰', '爱喝冷水', '想吃冰', '喝凉水舒服', '喜冷', '喝冰水', '想喝凉的'].some(k => text.includes(k)) },
  negate(text) { return ['喜热饮', '爱喝热水', '喝热水舒服', '想喝热的', '怕喝凉的'].some(k => text.includes(k)) },
  ask: '会不会想喝冰水/冷水、吃凉东西？喜欢冷饮说明体内是真正的热证(里热)。'
}
