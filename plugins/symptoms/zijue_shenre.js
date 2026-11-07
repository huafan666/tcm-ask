module.exports = {
  name: 'zijue_shenre',
  title: '自觉身热',
  trigger(text) { return ['身体热', '感觉热', '燥热'].some(k => text.includes(k)) },
  ask: '是不是自己感觉身体燥热发热，一点也不怕冷'
}
