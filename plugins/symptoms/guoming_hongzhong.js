module.exports = {
  name: 'guoming_hongzhong',
  title: '过敏红肿',
  trigger(text) { return ['过敏', '肿痛', '肿了', '红疹'].some(k => text.includes(k)) },
  ask: '是不是过敏了以后皮肤红肿，或者起红疹'
}
