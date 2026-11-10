module.exports = {
  name: 'wound_injury',
  title: '有刀斧外伤伤口',
  trigger(text) { return ['刀斧外伤', '有伤口', '被刀砍伤', '外伤创口', '金疮', '利器划伤', '身上有开放性伤口'].some(k => text.includes(k)) },
  negate(text) { return ['没有外伤'].some(k => text.includes(k)) },
  ask: '是不是身上有刀斧、利器造成的外伤伤口？'
}
