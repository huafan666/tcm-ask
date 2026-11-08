module.exports = {
  name: 'dahan',
  title: '打鼾/鼾声',
  trigger(text) { return ['打鼾', '打呼噜', '鼾声', '鼻鼾', '鼻息鼾', '出气重带鼾', '昏睡打鼾'].some(k => text.includes(k)) },
  ask: '是不是睡觉时会打呼噜，呼吸声很重、带着鼾声？'
}
