module.exports = {
  name: 'heat_only_no_chill',
  title: '只发热不发冷',
  trigger(text) { return ['只发热不发冷', '光发热不发冷', '只有热没有冷', '但热不寒', '一点不觉得冷只发热', '发烧但不发冷', '只烧不冷'].some(k => text.includes(k)) },
  negate(text) { return ['既发热又发冷', '发热也发冷'].some(k => text.includes(k)) },
  ask: '是不是只有发热，一点也不觉得冷？'
}
