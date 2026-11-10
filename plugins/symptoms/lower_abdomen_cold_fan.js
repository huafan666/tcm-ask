module.exports = {
  name: 'lower_abdomen_cold_fan',
  title: '小肚子像被扇风一样冷',
  trigger(text) { return ['小肚子像被扇风一样冷', '少腹如扇', '小腹一阵阵发凉', '小肚子像有风往里吹', '下腹冷得像扇风', '小腹冷飕飕'].some(k => text.includes(k)) },
  negate(text) { return ['小肚子不冷'].some(k => text.includes(k)) },
  ask: '是不是小肚子一阵阵发冷，像有人在旁边扇风一样？'
}
