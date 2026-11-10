module.exports = {
  name: 'unsteady_stance',
  title: '站立不稳',
  trigger(text) { return ['站立不稳', '站不住', '身子发晃', '走路发飘', '站不稳想倒下'].some(k => text.includes(k)) },
  negate(text) { return ['站得稳'].some(k => text.includes(k)) },
  ask: '是不是站着的时候身子发晃、站不稳，感觉要倒下去？'
}
