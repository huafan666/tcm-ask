module.exports = {
  name: 'hand_foot_hot',
  title: '手脚心发烫',
  trigger(text) { return ['手脚心发烫', '手脚发热', '手心脚心发热', '手足热', '手心发烫', '脚心发烫', '手脚心烧得慌', '手心脚心烫'].some(k => text.includes(k)) },
  negate(text) { return ['手脚不热', '手脚发凉'].some(k => text.includes(k)) },
  ask: '是不是手心脚心发烫，摸着比别处热？'
}
