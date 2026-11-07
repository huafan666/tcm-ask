module.exports = {
  name: 'floating_pulse',
  title: '脉浮',
  kind: 'pulse',
  trigger(text) { return ['脉浮', '浮脉'].some(k => text.includes(k)) }
}
