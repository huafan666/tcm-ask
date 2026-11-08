module.exports = {
  name: 'zijue_shenre',
  title: '自觉身热',
  trigger(text) { return ['身体热', '感觉热', '燥热'].some(k => text.includes(k)) },
  ask: '是不是自己觉得身上燥热，但一点也不怕冷？'
}
