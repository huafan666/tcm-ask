module.exports = {
  name: 'pseudo_cold_heat',
  title: '似冷非冷似热非热',
  trigger(text) { return ['似冷非冷', '像冷又不太冷', '觉得冷其实不冷', '觉得热其实不烫', '说冷不算冷说热不算热', '觉得冷可又不真冷', '觉得冷又不太冷', '冷又不真冷', '热又不真热', '似冷非冷似热非热'].some(k => text.includes(k)) },
  negate(text) { return ['冷热正常'].some(k => text.includes(k)) },
  ask: '是不是有时候觉得冷，可其实并不真冷；有时候觉得发热，量体温又不高？'
}
