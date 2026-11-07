module.exports = {
  name: 'shouyizhileng',
  title: '手一直冷',
  trigger(text) { return ['手一直冷', '手冷'].some(k => text.includes(k)) },
  ask: '是不是手一直感觉是冰的，冷的'
}
