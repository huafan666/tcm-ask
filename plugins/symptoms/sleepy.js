module.exports = {
  name: 'sleepy',
  title: '多眠睡',
  kind: 'symptom',
  trigger(text) { return ['多眠', '多睡', '嗜睡', '困倦嗜睡', '老想睡'].some(k => text.includes(k)) },
  negate(text) { return ['失眠', '不睡', '睡不着'].some(k => text.includes(k)) }
}
