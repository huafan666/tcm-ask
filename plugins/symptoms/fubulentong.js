module.exports = {
  name: 'fubulentong',
  title: '腹部冷痛',
  trigger(text) { return ['腹部冷痛', '腹痛', '肚子痛'].some(k => text.includes(k)) },
  ask: '是不是腹部冷痛，遇到冷会加重'
}
