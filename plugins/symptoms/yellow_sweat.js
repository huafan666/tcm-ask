module.exports = {
  name: 'yellow_sweat',
  title: '出黄汗',
  trigger(text) { return ['出黄汗', '汗是黄的', '汗把衣服染黄', '身上汗发黄', '衣服上汗渍发黄'].some(k => text.includes(k)) },
  negate(text) { return ['汗不发黄'].some(k => text.includes(k)) },
  ask: '是不是出的汗发黄，把内衣、被单染成黄色？'
}
