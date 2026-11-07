module.exports = {
  name: 'yanjing_duoleishui',
  title: '眼睛多泪水',
  trigger(text) { return ['流眼泪', '眼睛流眼泪', '眼泪多'].some(k => text.includes(k)) },
  ask: '是不是眼睛特别容易流眼泪'
}
