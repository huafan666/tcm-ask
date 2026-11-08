module.exports = {
  name: 'kouchibuqing',
  title: '口齿不清',
  trigger(text) { return ['口齿不清', '说话不利索', '说话不清楚'].some(k => text.includes(k)) },
  ask: '是不是说话吐字不清、不利索？'
}
