module.exports = {
  name: 'throat_rales',
  title: '喉咙里有水鸡叫的声音',
  trigger(text) { return ['喉咙里有水鸡叫', '喉中水鸡声', '喉咙里痰响', '嗓子眼里有拉锯声', '呼吸有哮鸣音', '喉咙里呼噜呼噜响', '喘起来嗓子里有声音', '喉中水鸡叫', '水鸡声', '嗓子里有声', '喉咙里痰声呼噜'].some(k => text.includes(k)) },
  negate(text) { return ['喉咙没声音'].some(k => text.includes(k)) },
  ask: '是不是一咳嗽、一喘，喉咙里就有像水鸡（青蛙）叫一样的痰鸣声？'
}
