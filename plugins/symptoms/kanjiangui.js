module.exports = {
  name: 'kanjiangui',
  title: '能看见鬼',
  trigger(text) { return ['能看见鬼'].some(k => text.includes(k)) },
  ask: '是不是好像能看见鬼，看见常人看不见的东西？'
}
