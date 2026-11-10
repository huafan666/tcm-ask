module.exports = {
  name: 'genital_cold',
  title: '前阴发冷',
  trigger(text) { return ['前阴发冷', '阴头寒', '下身发凉', '生殖器发凉', '阴部发冷'].some(k => text.includes(k)) },
  negate(text) { return ['下身不凉'].some(k => text.includes(k)) },
  ask: '是不是下身（前阴）总是发凉、摸着冷？'
}
