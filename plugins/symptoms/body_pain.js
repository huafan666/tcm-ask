module.exports = {
  name: 'body_pain',
  title: '体痛',
  kind: 'symptom',
  trigger(text) { return ['体痛', '身痛', '全身酸痛', '骨节痛', '全身都痛', '全身痛', '浑身都痛', '周身疼痛'].some(k => text.includes(k)) },
  ask: '是不是全身酸痛，骨头缝里也痛？'
}