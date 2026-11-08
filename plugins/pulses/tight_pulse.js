module.exports = {
  name: 'tight_pulse',
  title: '脉紧',
  kind: 'pulse',
  trigger(text) { return ['脉紧', '紧脉'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说脉绷得紧紧的、像按在绳子上（脉紧）？'
}
