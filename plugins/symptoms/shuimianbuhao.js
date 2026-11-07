module.exports = {
  name: 'shuimianbuhao',
  title: '睡眠不好',
  trigger(text) { return ['睡眠不好', '失眠', '睡得不好'].some(k => text.includes(k)) },
  ask: '是不是睡眠不是很好'
}
