module.exports = {
  name: 'shouhan',
  title: '手汗',
  trigger(text) { return ['手汗', '手出汗'].some(k => text.includes(k)) },
  ask: '是不是有手汗'
}
