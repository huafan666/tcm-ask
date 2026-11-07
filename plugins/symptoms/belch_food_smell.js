module.exports = {
  name: 'belch_food_smell',
  title: '干噫食臭',
  kind: 'symptom',
  trigger(text) { return ['干噫食臭', '嗳气带食物味', '打嗝有酸味', '嗳气有馊味'].some(k => text.includes(k)) },
  negate(text) { return ['不打嗝'].some(k => text.includes(k)) }
}

