module.exports = {
  name: 'blood_clot_dark',
  title: '出血颜色发黑暗淡',
  trigger(text) { return ['出血颜色发黑', '血色发暗', '血是黑褐色的', '流血颜色发黑发暗', '经血黑褐色', '血色暗淡有块'].some(k => text.includes(k)) },
  negate(text) { return ['血色鲜红'].some(k => text.includes(k)) },
  ask: '是不是出血的颜色发黑、发暗（偏黑褐色）？'
}
