module.exports = {
  name: 'throat_pain',
  title: '咽痛',
  kind: 'symptom',
  trigger(text) { return ['咽痛', '喉咙痛', '嗓子痛', '咽喉痛', '咽干痛'].some(k => text.includes(k)) },
  negate(text) { return ['嗓子不痛', '咽不痛', '喉咙不痛'].some(k => text.includes(k)) },
  ask: '喉咙/嗓子会不会痛？咽痛可因少阴阳虚(猪肤)或单纯火热(甘草桔梗)、生疮(苦酒)。'
}
