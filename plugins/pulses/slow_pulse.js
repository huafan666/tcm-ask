module.exports = {
  name: 'slow_pulse',
  title: '脉缓',
  kind: 'pulse',
  trigger(text) { return ['脉缓', '缓脉'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说脉跳得慢而和缓（脉缓）？'
}
