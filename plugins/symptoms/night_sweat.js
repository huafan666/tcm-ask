module.exports = {
  name: 'night_sweat',
  title: '睡着后出汗',
  trigger(text) { return ['睡着后出汗', '盗汗', '夜里出汗', '睡着了出汗', '半夜一身汗', '起床发现衣服湿了'].some(k => text.includes(k)) },
  negate(text) { return ['睡着不出汗', '没有盗汗'].some(k => text.includes(k)) },
  ask: '是不是一睡着就出汗，醒来发现衣服、被子都湿了？'
}
