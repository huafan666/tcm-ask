module.exports = {
  name: 'wei_suan',
  title: '胃酸',
  trigger(text) { return ['胃酸', '酸水', '反酸'].some(k => text.includes(k)) },
  ask: '是不是吃了甜的、冷的或者油腻的食物就会胃酸'
}
