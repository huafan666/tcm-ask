module.exports = {
  name: 'diarrhea',
  title: '下利',
  kind: 'symptom',
  trigger(text) { return ['下利', '腹泻', '拉肚子', '泄泻', '大便溏', '拉完反而舒服', '拉肚子后反而轻松', '泻后反而快然', '拉完觉得轻快'].some(k => text.includes(k)) },
  negate(text) { return ['不下利', '大便正常', '不拉'].some(k => text.includes(k)) },
  ask: '是不是最近在拉肚子、大便稀？'
}

