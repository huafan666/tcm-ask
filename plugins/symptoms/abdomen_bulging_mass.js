module.exports = {
  name: 'abdomen_bulging_mass',
  title: '肚子上鼓起一块像有头有脚',
  trigger(text) { return ['肚子鼓起一块', '肚皮上鼓起像有头有脚', '腹中鼓起硬块会动', '肚子上鼓包', '皮下鼓起一块上下走', '肚子鼓起来像有东西在顶', '肚皮上鼓起一块', '腹部鼓起一块', '肚子鼓起个包', '肚子上鼓起东西', '腹部有包块会移动'].some(k => text.includes(k)) },
  negate(text) { return ['肚子不鼓包'].some(k => text.includes(k)) },
  ask: '是不是肚子上鼓起一块，形状像有头有脚，还会上下移动？'
}
