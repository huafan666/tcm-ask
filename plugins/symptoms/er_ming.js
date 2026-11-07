module.exports = {
  name: 'er_ming',
  title: '耳鸣',
  trigger(text) { return ['耳鸣', '耳朵有声音'].some(k => text.includes(k)) },
  ask: '是不是耳鸣'
}
