module.exports = {
  name: 'forehead_dark',
  title: '额头发黑',
  trigger(text) { return ['额头发黑', '额上黑', '脑门发黑', '额头颜色发暗发黑', '额头黑一块'].some(k => text.includes(k)) },
  negate(text) { return ['额头颜色正常'].some(k => text.includes(k)) },
  ask: '是不是额头发黑、颜色发暗？'
}
