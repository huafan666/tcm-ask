module.exports = {
  name: 'body_pain',
  title: '体痛',
  kind: 'symptom',
  trigger(text) { return ['体痛', '身痛', '全身酸痛', '骨节痛'].some(k => text.includes(k)) }
}