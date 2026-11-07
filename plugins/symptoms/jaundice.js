module.exports = {
  name: 'jaundice',
  title: '身黄/发黄',
  kind: 'symptom',
  trigger(text) { return ['身黄', '发黄', '全身发黄', '皮肤黄', '目黄', '黄疸', '橘子色', '如橘子色'].some(k => text.includes(k)) },
  negate(text) { return ['皮肤不黄', '不发黄', '没有黄疸'].some(k => text.includes(k)) }
}
