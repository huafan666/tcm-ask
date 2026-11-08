module.exports = {
  name: 'duzijiaotonghuocitong',
  title: '肚子绞痛或刺痛',
  trigger(text) { return ['肚子痛', '绞痛', '刺痛'].some(k => text.includes(k)) },
  ask: '是不是肚子一阵阵地绞着痛，或者像针扎一样刺痛？'
}
