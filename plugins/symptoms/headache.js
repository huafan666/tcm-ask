module.exports = {
  name: 'headache',
  title: '头痛',
  trigger(text) { return ['头痛', '头疼', '脑袋疼', '头胀痛', '偏头痛', '后脑勺痛', '太阳穴痛', '头顶痛', '头一阵阵地痛', '头痛得厉害'].some(k => text.includes(k)) },
  negate(text) { return ['头不痛', '头不疼', '没有头痛'].some(k => text.includes(k)) },
  ask: '是不是头痛？（哪个部位都算）'
}
