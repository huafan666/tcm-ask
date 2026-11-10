module.exports = {
  name: 'urine_gravel',
  title: '小便像米粒样砂石',
  trigger(text) { return ['小便像米粒样', '小便如粟状', '尿里有砂石', '尿出小颗粒', '小便有砂粒状东西', '尿里有小结石', '尿出沙子样东西'].some(k => text.includes(k)) },
  negate(text) { return ['小便清亮'].some(k => text.includes(k)) },
  ask: '是不是小便里像有米粒、砂粒一样的东西排出来？'
}
