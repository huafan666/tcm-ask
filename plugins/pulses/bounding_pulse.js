module.exports = {
  name: 'bounding_pulse',
  title: '脉洪大',
  kind: 'pulse',
  trigger(text) { return ['脉洪大', '洪脉', '脉洪'].some(k => text.includes(k)) },
  negate(text) { return ['脉不洪'].some(k => text.includes(k)) },
  ask: '是不是有人给你把过脉，说你的脉又大又有力（脉洪大）？'
}
