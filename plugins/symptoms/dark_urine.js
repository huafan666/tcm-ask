module.exports = {
  name: 'dark_urine',
  title: '小便黄',
  kind: 'symptom',
  trigger(text) { return ['小便黄', '尿黄', '尿很黄', '尿黄赤', '黄尿'].some(k => text.includes(k)) },
  negate(text) { return ['小便清', '尿不黄', '尿清亮', '小便清长'].some(k => text.includes(k)) },
  ask: '是不是小便颜色发黄、发深？'
}
