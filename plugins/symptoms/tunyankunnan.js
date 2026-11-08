module.exports = {
  name: 'tunyankunnan',
  title: '吞咽困难',
  trigger(text) { return ['吃东西吞不下去', '咽不下去'].some(k => text.includes(k)) },
  ask: '是不是咽东西费劲、咽不下去？'
}
