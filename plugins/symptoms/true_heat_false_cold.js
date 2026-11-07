module.exports = {
  name: 'true_heat_false_cold',
  title: '真热假寒',
  kind: 'symptom',
  trigger(text) { return ['身大寒反不欲近衣', '真热假寒', '厥冷而有渴欲饮冷', '寒在皮肤热在骨髓'].some(k => text.includes(k)) },
  negate(text) { return ['不属真热假寒'].some(k => text.includes(k)) }
}
