module.exports = {
  name: 'limb_spasm',
  title: '四肢微急难以屈伸',
  kind: 'symptom',
  trigger(text) { return ['四肢微急', '难以屈伸', '手脚发紧', '四肢拘急', '抽筋难伸'].some(k => text.includes(k)) },
  negate(text) { return ['四肢灵活', '屈伸自如'].some(k => text.includes(k)) },
  ask: '是不是手脚发紧、有点抽，弯伸都不太灵活？'
}
