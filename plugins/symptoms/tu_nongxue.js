module.exports = {
  name: 'tu_nongxue',
  title: '吐脓血',
  trigger(text) { return ['吐脓'].some(k => text.includes(k)) },
  ask: '是不是会吐血，但是血里面有脓'
}
