module.exports = {
  name: 'zugengtong',
  title: '足跟痛',
  trigger(text) { return ['脚后跟痛', '足跟痛', '后跟痛', '脚跟疼'].some(k => text.includes(k)) },
  ask: '是不是脚后跟痛，感觉像骨头在痛？'
}
