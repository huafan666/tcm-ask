module.exports = {
  name: 'rapid_pulse',
  title: '脉数急',
  kind: 'pulse',
  trigger(text) { return ['脉数', '脉急', '数急', '脉数急'].some(k => text.includes(k)) },
  negate(text) { return ['脉静', '脉不数', '脉不数急', '脉不急'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说脉跳得又快又急（脉数急）？'
}
