module.exports = {
  name: 'kanjian_gui',
  title: '能看见鬼',
  trigger(text) { return ['看见鬼', '能看见鬼'].some(k => text.includes(k)) },
  ask: '是不是感觉自己能看见一般人看不见的东西，好像见鬼一样'
}
