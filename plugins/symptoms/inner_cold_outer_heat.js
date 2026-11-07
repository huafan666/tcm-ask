module.exports = {
  name: 'inner_cold_outer_heat',
  title: '里寒外热(面赤)',
  kind: 'symptom',
  trigger(text) { return ['里寒外热', '身反不恶寒', '面色赤', '脸发红', '面赤', '真寒假热'].some(k => text.includes(k)) },
  negate(text) { return ['面色正常', '脸不发红'].some(k => text.includes(k)) },
  ask: '是不是外面看着发热/脸红、其实内里怕冷虚弱(里寒外热)？这是真寒假热，通脉四逆汤象。'
}
