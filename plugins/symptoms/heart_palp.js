module.exports = {
  name: 'heart_palp',
  title: '心下悸',
  kind: 'symptom',
  trigger(text) { return ['心下悸', '心窝跳', '心口发悸', '心悸'].some(k => text.includes(k)) },
  negate(text) { return ['不悸', '心不跳'].some(k => text.includes(k)) },
  ask: '有没有心口/心下跳得慌、发悸的感觉？会忍不住双手按着胸口(叉手自冒心)？'
}

