module.exports = {
  name: 'buyun',
  title: '不孕',
  trigger(text) { return ['不孕'].some(k => text.includes(k)) },
  ask: '是不是不孕'
}
