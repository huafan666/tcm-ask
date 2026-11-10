module.exports = {
  name: 'black_stool',
  title: '大便发黑',
  trigger(text) { return ['大便发黑', '大便是黑的', '大便正黑', '便黑如柏油', '大便颜色发黑', '黑便', '大便黑褐色'].some(k => text.includes(k)) },
  negate(text) { return ['大便颜色正常'].some(k => text.includes(k)) },
  ask: '是不是大便颜色发黑，像柏油一样？'
}
