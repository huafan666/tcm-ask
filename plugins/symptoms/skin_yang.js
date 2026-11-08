module.exports = {
  name: 'skin_yang',
  title: '皮肤痒',
  trigger(text) { return ['痒', '皮肤痒', '身上痒'].some(k => text.includes(k)) },
  ask: '是不是皮肤特别痒，总想抓？'
}
