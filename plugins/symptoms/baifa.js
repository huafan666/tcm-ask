module.exports = {
  name: 'baifa',
  title: '白发',
  trigger(text) { return ['白发', '少白头', '白头发', '白头'].some(k => text.includes(k)) },
  ask: '是不是年纪不大就长了不少白头发？'
}
