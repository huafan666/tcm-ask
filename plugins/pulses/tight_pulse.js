module.exports = {
  name: 'tight_pulse',
  title: '脉紧',
  kind: 'pulse',
  trigger(text) { return ['脉紧', '紧脉'].some(k => text.includes(k)) }
}
