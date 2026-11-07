module.exports = {
  name: 'dahan',
  title: '打鼾',
  trigger(text) { return ['打鼾', '鼾声', '打呼噜'].some(k => text.includes(k)) },
  ask: '是不是打鼾'
}
