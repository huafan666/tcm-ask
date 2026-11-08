module.exports = {
  name: 'floating_pulse',
  title: '脉浮',
  kind: 'pulse',
  trigger(text) { return ['脉浮', '浮脉'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说脉浮在表面、轻轻一摸就摸到（脉浮）？'
}
