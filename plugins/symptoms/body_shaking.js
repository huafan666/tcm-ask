module.exports = {
  name: 'body_shaking',
  title: '身瞤动、振振欲辟地',
  kind: 'symptom',
  trigger(text) { return ['身瞤动', '肌肉跳动', '振振欲辟地', '站立不稳', '身体晃动', '肌肉瞤动'].some(k => text.includes(k)) },
  negate(text) { return ['身不摇'].some(k => text.includes(k)) },
  ask: '是不是身上肌肉不自主地跳动，站都站不稳、身子发晃？'
}

