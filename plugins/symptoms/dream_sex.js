module.exports = {
  name: 'dream_sex',
  title: '梦中性交',
  trigger(text) { return ['梦交', '梦里与人交合', '做梦性交', '晚上做梦同房'].some(k => text.includes(k)) },
  negate(text) { return ['没有这种梦'].some(k => text.includes(k)) },
  ask: '是不是晚上做梦时会有男女交合的梦境，醒来很累？'
}
