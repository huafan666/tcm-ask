module.exports = {
  name: 'hungry',
  title: '饥饿感',
  trigger(text) { return ['有点饿', '非常饿'].some(k => text.includes(k)) },
  ask: '是不是有饿的感觉，平时吃饭是不是有胃口'
}
