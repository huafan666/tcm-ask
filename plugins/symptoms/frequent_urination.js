module.exports = {
  name: 'frequent_urination',
  title: '小便数',
  kind: 'symptom',
  trigger(text) { return ['小便数', '尿次数多', '老是上厕所', '小便频繁', '尿频'].some(k => text.includes(k)) },
  negate(text) { return ['小便正常', '尿次不多'].some(k => text.includes(k)) },
  ask: '是不是小便次数明显比平时多，老想上厕所？'
}
