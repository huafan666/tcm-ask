module.exports = {
  name: 'no_sweat',
  title: '无汗',
  kind: 'symptom',
  trigger(text) { return ['无汗', '没汗', '没有汗', '皮肤光滑', '一点汗都没有', '干爽没汗'].some(k => text.includes(k)) },
  negate(text) { return ['有汗', '身上是湿的', '在出汗'].some(k => text.includes(k)) },
  ask: '是不是完全没有汗？摸后背光滑干爽=无汗。无汗常伴怕冷恶寒，这点很重要。'
}

