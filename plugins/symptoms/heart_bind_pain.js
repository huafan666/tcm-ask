module.exports = {
  name: 'heart_bind_pain',
  title: '心中结痛',
  trigger(text) { return ['心中结痛', '心口一阵阵结着痛', '胸口绞痛'].some(k => text.includes(k)) },
  negate(text) { return ['心口不痛'].some(k => text.includes(k)) },
  ask: '是不是心口那里一阵阵地发紧、结着疼？'
}
