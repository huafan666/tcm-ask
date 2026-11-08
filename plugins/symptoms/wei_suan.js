module.exports = {
  name: 'wei_suan',
  title: '胃酸',
  trigger(text) { return ['胃酸', '酸水', '反酸'].some(k => text.includes(k)) },
  ask: '是不是吃甜的、凉的或油腻的就会反酸水？'
}
