module.exports = {
  name: 'hematemesis',
  title: '吐血',
  trigger(text) { return ['吐血', '吐出血来', '呕出血', '咳嗽吐血', '嘴里吐出血'].some(k => text.includes(k)) },
  negate(text) { return ['不吐血'].some(k => text.includes(k)) },
  ask: '是不是会吐血（从嘴里吐出带血的东西）？'
}
