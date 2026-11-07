module.exports = {
  name: 'wocanminxian',
  title: '卧蚕明显',
  trigger(text) { return ['卧蚕明显'].some(k => text.includes(k)) },
  ask: '卧蚕是不是非常明显，感觉肿起来一样'
}
