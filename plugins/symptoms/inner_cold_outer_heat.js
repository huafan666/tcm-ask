module.exports = {
  name: 'inner_cold_outer_heat',
  title: '里寒外热',
  kind: 'symptom',
  trigger(text) { return ['里寒外热', '身反不恶寒', '真寒假热'].some(k => text.includes(k)) },
  negate(text) { return ['面色正常', '脸不发红'].some(k => text.includes(k)) },
  ask: '是不是脸发红、看着像发热，但人其实怕冷、精神差？'
}
