module.exports = {
  name: 'shuangtuiwuli',
  title: '双腿无力',
  trigger(text) { return ['腿没力气', '腿发软', '站不起来'].some(k => text.includes(k)) },
  ask: '是不是两条腿发软、没力气，站久了都吃力？'
}
