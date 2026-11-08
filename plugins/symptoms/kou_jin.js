module.exports = {
  name: 'kou_jin',
  title: '口噤',
  trigger(text) { return ['口噤', '牙关紧闭', '口不能开', '牙关咬紧', '嘴张不开', '牙关发紧'].some(k => text.includes(k)) },
  negate(text) { return ['口不噤', '牙关能张', '嘴张得开'].some(k => text.includes(k)) },
  ask: '是不是嘴巴张不开、牙关咬得紧紧的，话都说不利索？'
}
