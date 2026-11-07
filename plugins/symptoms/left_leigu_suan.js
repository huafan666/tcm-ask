module.exports = {
  name: 'left_leigu_suan',
  title: '左侧肋骨酸',
  trigger(text) { return ['左侧的肋骨酸', '左侧肋骨酸'].some(k => text.includes(k)) },
  ask: '左侧肋骨是不是很酸'
}
