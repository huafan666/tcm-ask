module.exports = {
  name: 'left_leigu_suan',
  title: '左侧肋骨酸',
  trigger(text) { return ['左侧的肋骨酸', '左侧肋骨酸'].some(k => text.includes(k)) },
  ask: '是不是左边肋骨那块特别酸？'
}
