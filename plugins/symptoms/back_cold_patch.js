module.exports = {
  name: 'back_cold_patch',
  title: '背部一块发冷',
  trigger(text) { return ['背部一块发冷', '背寒冷如手大', '背上有一块老是凉的', '后背一块冰凉', '背部一块像巴掌大小发冷', '背上巴掌大一块冷'].some(k => text.includes(k)) },
  negate(text) { return ['背部不发冷'].some(k => text.includes(k)) },
  ask: '是不是背上有一块（大约巴掌大小）老是发冷？'
}
