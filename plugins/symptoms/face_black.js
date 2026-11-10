module.exports = {
  name: 'face_black',
  title: '面色发黑',
  trigger(text) { return ['面色发黑', '脸色发黑', '面色黧黑', '脸色暗黑', '脸发黑', '面色晦暗', '脸色灰黑', '黑眼圈很重面色暗'].some(k => text.includes(k)) },
  negate(text) { return ['脸色不黑'].some(k => text.includes(k)) },
  ask: '是不是脸色发黑、发暗、灰蒙蒙的？'
}
