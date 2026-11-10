module.exports = {
  name: 'lower_abdomen_cramp',
  title: '小肚子发紧拘急',
  trigger(text) { return ['小肚子发紧', '少腹弦急', '少腹拘急', '小腹抽紧', '肚子下面绷得紧', '小肚子一阵阵抽紧', '小腹拘急'].some(k => text.includes(k)) },
  negate(text) { return ['小肚子不紧'].some(k => text.includes(k)) },
  ask: '是不是小肚子（肚脐以下）发紧、绷着，一阵阵抽紧不舒服？'
}
