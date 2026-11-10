module.exports = {
  name: 'jaundice',
  title: '皮肤眼睛发黄',
  kind: 'symptom',
  trigger(text) { return ['身黄', '全身发黄', '皮肤黄', '皮肤发黄', '身上发黄', '目黄', '眼睛发黄', '眼白发黄', '黄疸', '橘子色', '如橘子色'].some(k => text.includes(k)) },
  negate(text) { return ['皮肤不黄', '不发黄', '没有黄疸'].some(k => text.includes(k)) },
  ask: '是不是皮肤、眼白发黄，尿也黄？'
}
