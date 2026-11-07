module.exports = {
  name: 'sweat',
  title: '汗出',
  kind: 'symptom',
  trigger(text) { return ['有汗', '出汗', '汗出', '在出汗', '身上出汗', '有点汗'].some(k => text.includes(k)) },
  negate(text) { return ['没出汗', '无汗', '不出汗', '不汗'].some(k => text.includes(k)) },
  ask: '现在身上有没有出汗？摸后背或胸口：略湿略糙=有汗；光滑干爽=无汗。'
}

