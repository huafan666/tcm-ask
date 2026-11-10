module.exports = {
  name: 'polyuria',
  title: '尿特别多',
  trigger(text) { return ['尿特别多', '小便量很多', '喝一斗尿一斗', '喝多少尿多少', '尿量特别大', '一天尿好多', '喝了水马上就尿出来很多'].some(k => text.includes(k)) },
  negate(text) { return ['尿不多', '小便正常'].some(k => text.includes(k)) },
  ask: '是不是尿量特别多，喝多少水就尿多少？'
}
