module.exports = {
  name: 'tearing_eyes',
  title: '眼泪自己流出来',
  trigger(text) { return ['眼泪自己流出来', '目泣自出', '不自觉流泪', '咳得眼泪直流', '眼睛老是自己流泪', '一咳就流泪'].some(k => text.includes(k)) },
  negate(text) { return ['不流泪'].some(k => text.includes(k)) },
  ask: '是不是没哭，眼泪却自己流出来（尤其咳得厉害时）？'
}
