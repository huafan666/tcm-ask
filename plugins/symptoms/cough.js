module.exports = {
  name: 'cough',
  title: '咳',
  kind: 'symptom',
  trigger(text) { return ['咳嗽', '咳', '咳嗽不止'].some(k => text.includes(k)) },
  negate(text) { return ['不咳', '不咳嗽'].some(k => text.includes(k)) },
  ask: '是不是在咳嗽，咳起来一阵一阵的？'
}

