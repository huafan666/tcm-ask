module.exports = {
  name: 'chest_fullness',
  title: '胸满',
  kind: 'symptom',
  trigger(text) { return ['胸满', '胸闷', '胸中满闷', '胸胀', '胸口发满', '胸里发满', '胸前发满', '胸口胀满'].some(k => text.includes(k)) },
  negate(text) { return ['胸不闷'].some(k => text.includes(k)) },
  ask: '是不是胸口发胀、发满、憋闷？'
}
