module.exports = {
  name: 'qi_surge',
  title: '气上冲',
  kind: 'symptom',
  trigger(text) { return ['气上冲', '气往上冲', '气上冲胸', '气冲'].some(k => text.includes(k)) },
  negate(text) { return ['气不上冲'].some(k => text.includes(k)) },
  ask: '是不是感觉有气从下往上冲，冲到胸口或者嗓子？'
}

