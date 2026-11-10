module.exports = {
  name: 'cold_drink_desire',
  title: '喜冷饮/吃冰',
  kind: 'symptom',
  trigger(text) { return ['喜冷饮', '喜欢喝冰', '爱喝冷水', '想吃冰', '喝凉水舒服', '喜冷', '喝冰水', '想喝凉的'].some(k => text.includes(k)) },
  negate(text) { return ['喜热饮', '爱喝热水', '喝热水舒服', '想喝热的', '怕喝凉的', '不爱喝凉的', '不爱喝冰凉', '不想喝凉的', '不想喝冰', '喝凉的不舒服', '不喝凉的', '不喜冷饮', '不想吃冰'].some(k => text.includes(k)) },
  ask: '是不是特别想喝冰水、吃凉的东西，吃了觉得舒服？'
}
