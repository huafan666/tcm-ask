module.exports = {
  name: 'fubulentong',
  title: '腹部冷痛',
  trigger(text) { return ['腹部冷痛', '腹痛', '肚子痛'].some(k => text.includes(k)) },
  ask: '是不是肚子是冷痛，用热水袋捂一捂、按一按会舒服些？'
}
