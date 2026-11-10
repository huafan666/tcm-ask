module.exports = {
  name: 'chest_back_pain',
  title: '胸痛连着后背疼',
  trigger(text) { return ['胸痛连着后背', '胸背痛', '胸口痛扯到后背', '胸前痛后背也痛', '胸痛连背', '胸口连着背部痛', '前胸后背都痛'].some(k => text.includes(k)) },
  negate(text) { return ['胸背不痛'].some(k => text.includes(k)) },
  ask: '是不是胸口痛，同时后背也跟着痛、像一条线连着？'
}
