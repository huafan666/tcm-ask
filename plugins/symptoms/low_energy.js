module.exports = {
  name: 'low_energy',
  title: '提不起劲',
  trigger(text) { return ['提不起劲', '没精神', '蔫蔫的', '浑身没劲不想动', '懒得动'].some(k => text.includes(k)) },
  negate(text) { return ['精神很好', '有劲'].some(k => text.includes(k)) },
  ask: '是不是整天提不起劲、浑身没精神，就想躺着？'
}
