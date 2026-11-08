module.exports = {
  name: 'poor_complexion',
  title: '气色差/面色不好',
  kind: 'symptom',
  trigger(text) { return ['气色差', '面色不好', '面色萎黄', '脸色差', '面青', '面白无华', '没血色', '脸色苍白', '面色青灰', '气虚'].some(k => text.includes(k)) },
  negate(text) { return ['气色好', '面色红润', '有血色', '脸色不错'].some(k => text.includes(k)) },
  ask: '是不是气色不好，脸色发白发青、没血色？'
}
