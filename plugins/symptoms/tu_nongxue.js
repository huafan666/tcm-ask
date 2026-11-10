module.exports = {
  name: 'tu_nongxue',
  title: '吐脓血',
  trigger(text) { return ['吐脓', '吐脓血', '唾脓血', '咳脓血', '咳出脓血', '痰里带脓', '吐的东西带脓', '咳血带脓'].some(k => text.includes(k)) },
  ask: '是不是吐出来的东西带血又带脓？'
}
