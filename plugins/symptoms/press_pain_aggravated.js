module.exports = {
  name: 'press_pain_aggravated',
  title: '按之痛剧',
  trigger(text) { return ['按之痛剧', '一碰就痛', '碰到就痛得厉害', '轻触即痛', '不让碰'].some(k => text.includes(k)) },
  negate(text) { return ['按着不痛', '碰了也不痛'].some(k => text.includes(k)) },
  ask: '是不是那个地方一碰就痛得厉害，连被子压着都难受？'
}
