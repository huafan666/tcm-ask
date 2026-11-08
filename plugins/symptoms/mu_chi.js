module.exports = {
  name: 'mu_chi',
  title: '目赤',
  trigger(text) { return ['目赤', '白睛发红', '白睛红', '眼睛发红', '眼睛红', '两眼发红'].some(k => text.includes(k)) },
  negate(text) { return ['眼不红', '眼睛不红'].some(k => text.includes(k)) },
  ask: '是不是眼睛发红、连眼白也红？'
}
