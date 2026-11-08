module.exports = {
  name: 'abdominal_fullness',
  title: '腹胀满',
  kind: 'symptom',
  trigger(text) { return ['腹胀', '腹胀满', '肚子胀', '腹满'].some(k => text.includes(k)) },
  negate(text) { return ['腹不胀'].some(k => text.includes(k)) },
  ask: '是不是肚子胀、发满，摸上去鼓鼓的？'
}

