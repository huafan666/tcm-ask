module.exports = {
  name: 'oozing_skin',
  title: '皮肤渗水流水',
  trigger(text) { return ['皮肤渗水', '皮肤流水', '疮面流水', '流水不止', '皮肤湿漉漉渗液', '疮里渗出黄水'].some(k => text.includes(k)) },
  negate(text) { return ['皮肤干燥不渗水'].some(k => text.includes(k)) },
  ask: '是不是皮肤（疮面）会渗水、流黄水？'
}
