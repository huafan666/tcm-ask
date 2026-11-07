module.exports = {
  name: 'duzijiaotonghuocitong',
  title: '肚子绞痛或刺痛',
  trigger(text) { return ['肚子痛', '绞痛', '刺痛'].some(k => text.includes(k)) },
  ask: '是不是肚子刺痛，或者绞痛'
}
