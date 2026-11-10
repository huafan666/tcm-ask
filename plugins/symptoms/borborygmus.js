module.exports = {
  name: 'borborygmus',
  title: '腹中雷鸣',
  kind: 'symptom',
  trigger(text) { return ['腹中雷鸣', '肠鸣', '肚子咕噜噜响', '肠鸣音大', '肚子咕噜响', '肚子咕咕叫', '腹中咕噜', '肠子咕噜响', '肚子里咕噜咕噜'].some(k => text.includes(k)) },
  negate(text) { return ['肚子不响'].some(k => text.includes(k)) },
  ask: '是不是肚子里咕噜咕噜响，声音还挺大（肠鸣）？'
}

