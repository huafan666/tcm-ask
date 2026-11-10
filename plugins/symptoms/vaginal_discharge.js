module.exports = {
  name: 'vaginal_discharge',
  title: '白带多/下白物',
  trigger(text) { return ['白带多', '下白物', '白带量多', '分泌物多', '白带绵绵不断', '阴道流出白色物'].some(k => text.includes(k)) },
  negate(text) { return ['白带正常'].some(k => text.includes(k)) },
  ask: '是不是白带（分泌物）特别多、绵绵不断？'
}
