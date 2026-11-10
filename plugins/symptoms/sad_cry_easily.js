module.exports = {
  name: 'sad_cry_easily',
  title: '老想哭、莫名悲伤',
  trigger(text) { return ['老想哭', '莫名悲伤想哭', '喜悲伤欲哭', '无缘无故就想哭', '心里难过老掉眼泪', '情绪一低落就哭', '控制不住想哭'].some(k => text.includes(k)) },
  negate(text) { return ['情绪平稳'].some(k => text.includes(k)) },
  ask: '是不是经常莫名地悲伤、控制不住想哭？'
}
