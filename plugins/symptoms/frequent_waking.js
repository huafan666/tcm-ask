module.exports = {
  name: 'frequent_waking',
  title: '睡着了容易醒',
  trigger(text) { return ['睡着了容易醒', '容易醒', '睡着了老醒', '半夜老醒', '醒好几次', '睡一会就醒', '夜里总醒', '醒醒睡睡'].some(k => text.includes(k)) },
  negate(text) { return ['一觉到天亮', '中间不醒'].some(k => text.includes(k)) },
  ask: '是不是睡着了也容易醒，一晚上要醒好几次？'
}
