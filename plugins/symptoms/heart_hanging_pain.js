module.exports = {
  name: 'heart_hanging_pain',
  title: '心口像悬空一样地疼',
  trigger(text) { return ['心口像悬空一样疼', '心悬痛', '心口空落落地疼', '心口悬着疼', '心口发空又疼', '心口揪着一阵阵疼'].some(k => text.includes(k)) },
  negate(text) { return ['心口不疼'].some(k => text.includes(k)) },
  ask: '是不是心口那里像悬空、往下坠着疼，一阵一阵揪着？'
}
