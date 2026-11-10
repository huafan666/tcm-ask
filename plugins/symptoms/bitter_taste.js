module.exports = {
  name: 'bitter_taste',
  title: '嘴里发苦',
  trigger(text) { return ['嘴里发苦', '口苦', '嘴巴苦', '一早就苦', '嘴里苦'].some(k => text.includes(k)) },
  negate(text) { return ['嘴里不苦', '口不苦'].some(k => text.includes(k)) },
  ask: '是不是嘴里总发苦，尤其早上起来更明显？'
}
