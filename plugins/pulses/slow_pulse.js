module.exports = {
  name: 'slow_pulse',
  title: '脉缓',
  kind: 'pulse',
  trigger(text) { return ['脉缓', '缓脉'].some(k => text.includes(k)) }
}
