module.exports = {
  name: 'sleepy',
  title: '多眠睡',
  kind: 'symptom',
  trigger(text) { return ['多眠', '多睡', '嗜睡', '困倦嗜睡', '老想睡', '默默欲眠', '总想睡', '老想躺着', '想睡又睡不踏实'].some(k => text.includes(k)) },
  negate(text) { return ['失眠', '不睡', '睡不着'].some(k => text.includes(k)) },
  ask: '是不是白天也老想睡、整天昏昏沉沉？'
}
