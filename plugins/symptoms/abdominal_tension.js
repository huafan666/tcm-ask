module.exports = {
  name: 'abdominal_tension',
  title: '肚子拘急发紧',
  trigger(text) { return ['肚子拘急', '腹中拘急', '里急', '肚子一阵阵抽紧', '肚子里绷得紧', '腹部拘急不舒服', '肚子发紧发痛', '肚子一阵阵发紧', '肚子发紧', '腹部发紧', '肚子绷着'].some(k => text.includes(k)) },
  negate(text) { return ['肚子不紧'].some(k => text.includes(k)) },
  ask: '是不是肚子里面绷得紧、一阵阵抽着不舒服（原文叫「里急」）？'
}
