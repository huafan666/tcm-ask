module.exports = {
  name: 'burning',
  title: '身体灼热',
  kind: 'symptom',
  trigger(text) { return ['灼热', '身体灼热', '身热如焚', '烫得难受'].some(k => text.includes(k)) },
  negate(text) { return ['不灼热', '身体不热'].some(k => text.includes(k)) },
  ask: '是不是身上一阵阵发烫，像火烧一样？'
}
