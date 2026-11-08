module.exports = {
  name: 'wocanminxian',
  title: '卧蚕明显',
  trigger(text) { return ['卧蚕明显'].some(k => text.includes(k)) },
  ask: '是不是下眼皮那块（卧蚕）特别鼓，像肿起来一样？'
}
