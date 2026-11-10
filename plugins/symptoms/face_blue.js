module.exports = {
  name: 'face_blue',
  title: '面色发青',
  trigger(text) { return ['脸色发青', '面色发青', '面目青', '脸发青', '脸色青紫', '嘴唇发青', '脸发青白', '面色青紫'].some(k => text.includes(k)) },
  negate(text) { return ['脸色正常', '面色不青'].some(k => text.includes(k)) },
  ask: '是不是脸色（连着眼睛周围）发青、发暗？'
}
