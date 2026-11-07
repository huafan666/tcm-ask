module.exports = {
  name: 'severe_abdominal_pain',
  title: '大实痛(拒按)',
  kind: 'symptom',
  trigger(text) { return ['大实痛', '肚子剧痛', '拒按', '按肚子痛更甚', '腹满不减拒按', '绞痛拒按'].some(k => text.includes(k)) },
  negate(text) { return ['按肚子舒服', '喜按', '肚子不痛'].some(k => text.includes(k)) },
  ask: '肚子是不是剧痛、按下去更痛、不让碰(拒按)？拒按是实证；时隐痛/喜按是虚寒。'
}
