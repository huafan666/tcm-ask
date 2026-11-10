module.exports = {
  name: 'vomit_right_after_eating',
  title: '一吃完就吐',
  trigger(text) { return ['一吃完就吐', '食已即吐', '刚吃完马上吐', '吃下去立刻就吐出来', '吃完饭立刻吐'].some(k => text.includes(k)) },
  negate(text) { return ['吃完不马上吐'].some(k => text.includes(k)) },
  ask: '是不是刚吃完东西马上就吐出来？'
}
