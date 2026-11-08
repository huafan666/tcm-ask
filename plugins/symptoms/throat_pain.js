module.exports = {
  name: 'throat_pain',
  title: '咽痛',
  kind: 'symptom',
  trigger(text) { return ['咽痛', '喉咙痛', '嗓子痛', '咽喉痛', '咽干痛'].some(k => text.includes(k)) },
  negate(text) { return ['嗓子不痛', '咽不痛', '喉咙不痛'].some(k => text.includes(k)) },
  ask: '是不是嗓子（喉咙）痛？'
}
