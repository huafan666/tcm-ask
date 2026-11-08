module.exports = {
  name: 'hasty_pulse',
  title: '脉促',
  kind: 'pulse',
  trigger(text) { return ['脉促', '促脉'].some(k => text.includes(k)) },
  negate(text) { return ['脉不促'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说脉跳得快、中间还有停顿（脉促）？'
}
