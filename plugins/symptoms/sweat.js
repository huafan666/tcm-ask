module.exports = {
  name: 'sweat',
  title: '汗出',
  kind: 'symptom',
  trigger(text) { return ['有汗', '出汗', '汗出', '在出汗', '身上出汗', '有点汗', '出很多汗', '大汗', '一身汗', '出了汗', '汗多'].some(k => text.includes(k)) },
  negate(text) { return ['没出汗', '无汗', '不出汗', '不汗'].some(k => text.includes(k)) },
  ask: '是不是现在身上有汗，摸着潮乎乎的？'
}

