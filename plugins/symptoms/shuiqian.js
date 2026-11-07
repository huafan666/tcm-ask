module.exports = {
  name: 'shuiqian',
  title: '睡浅',
  trigger(text) { return ['睡眠比较浅', '睡眠浅'].some(k => text.includes(k)) },
  ask: '是不是睡眠比较浅，睡不深入，容易做梦'
}
