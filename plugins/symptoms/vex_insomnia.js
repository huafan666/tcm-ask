module.exports = {
  name: 'vex_insomnia',
  title: '虚烦不得眠',
  kind: 'symptom',
  trigger(text) { return ['虚烦', '烦不得眠', '心中懊恼', '反复颠倒', '烦闷失眠'].some(k => text.includes(k)) },
  negate(text) { return ['能睡', '不烦'].some(k => text.includes(k)) }
}

