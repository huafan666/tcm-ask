module.exports = {
  name: 'shuimianbuhao',
  title: '睡眠不好',
  trigger(text) { return ['睡眠不好', '睡不好', '失眠', '睡得不好', '睡眠比较浅', '睡眠浅', '睡不实', '容易醒'].some(k => text.includes(k)) },
  ask: '是不是睡眠不好，睡得浅、容易醒，或者翻来覆去睡不着？'
}
