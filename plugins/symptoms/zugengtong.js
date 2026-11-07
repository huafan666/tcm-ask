module.exports = {
  name: 'zugengtong',
  title: '足跟痛',
  trigger(text) { return ['脚后跟痛', '足跟痛'].some(k => text.includes(k)) },
  ask: '是不是脚后跟痛，感觉具体是骨头痛'
}
