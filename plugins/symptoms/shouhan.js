module.exports = {
  name: 'shouhan',
  title: '手汗',
  trigger(text) { return ['手汗', '手出汗', '手足汗出', '手足出汗', '手足濈然汗出', '手足濈然', '濈然汗出', '手脚出汗', '手脚老出汗'].some(k => text.includes(k)) },
  ask: '是不是手心老出汗、湿湿的？'
}
