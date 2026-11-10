module.exports = {
  name: 'body_pain',
  title: '体痛',
  kind: 'symptom',
  trigger(text) { return ['体痛', '身痛', '全身酸痛', '骨节痛', '全身都痛', '全身痛', '浑身都痛', '周身疼痛', '身痛如被杖', '身上像被打过', '浑身像挨了一顿打', '身上痛得像被棍子打过', '痛得像被打过', '像被棍子打过', '浑身像挨了打'].some(k => text.includes(k)) },
  ask: '是不是全身酸痛，骨头缝里也痛？'
}