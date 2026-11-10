module.exports = {
  name: 'mute_quiet',
  title: '不想说话',
  trigger(text) { return ['不想说话', '不爱说话', '沉默寡言', '懒得说话', '一句话都不想说'].some(k => text.includes(k)) },
  negate(text) { return ['话很多', '愿意说话'].some(k => text.includes(k)) },
  ask: '是不是不想开口说话，别人跟你说话也懒得答？'
}
