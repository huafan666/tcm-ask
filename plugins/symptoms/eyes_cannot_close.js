module.exports = {
  name: 'eyes_cannot_close',
  title: '眼睛闭不上',
  trigger(text) { return ['眼睛闭不上', '眼睛合不上', '想闭眼闭不上', '睡觉眼睛闭不严', '眼睛合不拢', '眼皮合不上', '想闭眼却闭不上', '闭不上眼', '眼闭不拢'].some(k => text.includes(k)) },
  negate(text) { return ['眼睛能闭上', '眼睛闭得上'].some(k => text.includes(k)) },
  ask: '是不是想闭眼睛歇一会儿，可眼皮合不上、眼睛闭不严？'
}
