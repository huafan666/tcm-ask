module.exports = {
  name: 'hypochondriac_fullness',
  title: '胸胁苦满',
  kind: 'symptom',
  trigger(text) { return ['胸胁苦满', '胁下满', '胁肋胀满', '两肋胀', '胁下痞'].some(k => text.includes(k)) },
  negate(text) { return ['胁不胀'].some(k => text.includes(k)) },
  ask: '是不是两侧肋巴骨下面（胸胁）胀满、发闷发堵？'
}

