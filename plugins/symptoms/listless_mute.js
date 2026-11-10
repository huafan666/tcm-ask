module.exports = {
  name: 'listless_mute',
  title: '提不起劲、不想说话',
  trigger(text) { return ['提不起劲', '不想说话', '不爱说话', '蔫蔫的', '愣愣的'].some(k => text.includes(k)) },
  negate(text) { return ['精神很好', '话很多'].some(k => text.includes(k)) },
  ask: '是不是整天提不起劲，不想说话，也不想动，就愣愣地待着？'
}
