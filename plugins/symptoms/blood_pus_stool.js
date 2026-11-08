module.exports = {
  name: 'blood_pus_stool',
  title: '便脓血',
  kind: 'symptom',
  trigger(text) { return ['便脓血', '拉脓血', '大便带脓血', '下利便脓血', '拉血便脓', '脓血便'].some(k => text.includes(k)) },
  negate(text) { return ['大便没脓血', '无脓血'].some(k => text.includes(k)) },
  ask: '是不是大便里带脓、带血，或者像鼻涕一样的粘液？'
}
