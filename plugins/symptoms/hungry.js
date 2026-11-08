module.exports = {
  name: 'hungry',
  title: '饥饿感',
  trigger(text) { return ['有点饿', '非常饿'].some(k => text.includes(k)) },
  ask: '是不是容易觉得饿，平时吃饭也有胃口？'
}
