module.exports = {
  name: 'joint_pain_severe',
  title: '关节痛得剧烈',
  trigger(text) { return ['关节痛得剧烈', '关节剧痛', '疼得钻心', '疼得受不了', '痛得整夜睡不着', '关节疼得直叫', '痛得像被老虎咬'].some(k => text.includes(k)) },
  negate(text) { return ['疼得不厉害', '只是有点疼'].some(k => text.includes(k)) },
  ask: '是不是关节疼得特别剧烈，疼得受不了、晚上都睡不着？'
}
