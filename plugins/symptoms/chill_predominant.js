module.exports = {
  name: 'chill_predominant',
  title: '冷多热少',
  trigger(text) { return ['冷多热少', '发冷多发热少', '怕冷多发热少', '寒多热少', '冷的时候长热的时候短', '以发冷为主', '主要是发冷'].some(k => text.includes(k)) },
  negate(text) { return ['热多冷少'].some(k => text.includes(k)) },
  ask: '是不是发冷的时候多、发热的时候少，冷得比较明显？'
}
