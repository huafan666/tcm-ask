module.exports = {
  name: 'manic',
  title: '如狂',
  kind: 'symptom',
  trigger(text) { return ['如狂', '发狂', '狂躁', '躁狂不安', '精神狂扰'].some(k => text.includes(k)) },
  negate(text) { return ['神志平静'].some(k => text.includes(k)) }
}

