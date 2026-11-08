module.exports = {
  name: 'touda',
  title: '头大',
  trigger(text) { return ['头很大'].some(k => text.includes(k)) },
  ask: '是不是头很大，比常人的大'
}
