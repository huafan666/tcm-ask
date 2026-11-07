module.exports = {
  name: 'kouchibuqing',
  title: '口齿不清',
  trigger(text) { return ['口齿不清', '说话不利索', '说话不清楚'].some(k => text.includes(k)) },
  ask: '是不是口齿不清，说话不利索'
}
