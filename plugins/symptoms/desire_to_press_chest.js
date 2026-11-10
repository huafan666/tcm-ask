module.exports = {
  name: 'desire_to_press_chest',
  title: '总想捶打胸口',
  trigger(text) { return ['总想捶打胸口', '想捶胸口', '常欲蹈其胸上', '胸口发闷想捶一捶', '喜欢捶打胸口', '捶打胸口才舒服', '胸口闷得想敲', '想捶胸口才舒服', '胸口闷得想捶', '想压一压胸口'].some(k => text.includes(k)) },
  negate(text) { return ['不想捶胸口'].some(k => text.includes(k)) },
  ask: '是不是胸口发闷，总想用手捶一捶、压一压才舒服？'
}
