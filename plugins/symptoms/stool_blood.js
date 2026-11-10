module.exports = {
  name: 'stool_blood',
  title: '大便带血',
  trigger(text) { return ['大便带血', '便血', '下血', '拉出带血', '大便有血', '上厕所见血'].some(k => text.includes(k)) },
  negate(text) { return ['大便不带血'].some(k => text.includes(k)) },
  ask: '是不是大便时带血？'
}
