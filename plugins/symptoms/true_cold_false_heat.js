module.exports = {
  name: 'true_cold_false_heat',
  title: '真寒假热',
  kind: 'symptom',
  trigger(text) { return ['身大热反欲得衣', '真寒假热', '面红如妆肢冷', '热在皮肤寒在骨髓'].some(k => text.includes(k)) },
  negate(text) { return ['不属真寒假热'].some(k => text.includes(k)) }
}
