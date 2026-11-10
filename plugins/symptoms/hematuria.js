module.exports = {
  name: 'hematuria',
  title: '尿里有血',
  trigger(text) { return ['尿里有血', '尿血', '小便带血', '尿是红的', '小便发红', '尿中见血'].some(k => text.includes(k)) },
  negate(text) { return ['尿里没血'].some(k => text.includes(k)) },
  ask: '是不是小便里有血、颜色发红？'
}
