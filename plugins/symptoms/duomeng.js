module.exports = {
  name: 'duomeng',
  title: '多梦',
  trigger(text) { return ['经常做梦', '梦特别多', '梦多', '做梦'].some(k => text.includes(k)) },
  ask: '是不是晚上梦特别多，睡得不踏实？'
}
