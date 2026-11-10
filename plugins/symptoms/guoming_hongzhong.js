module.exports = {
  name: 'guoming_hongzhong',
  title: '过敏红肿',
  // 原来带 '肿痛'、'肿了' 这种太宽的词：病人说「关节肿痛」会被当成皮肤过敏，
  // 而关节那一摊另有 joint_swelling / joint_red_hot 管。这里只管皮肤上的红肿。
  trigger(text) { return ['过敏', '皮肤红肿', '起的红疹', '起红疹', '荨麻疹', '风团'].some(k => text.includes(k)) },
  ask: '是不是皮肤过敏、红肿，或者起疹子发痒？'
}
