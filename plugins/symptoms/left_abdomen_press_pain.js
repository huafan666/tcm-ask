module.exports = {
  name: 'left_abdomen_press_pain',
  title: '左下腹(大肠)按痛',
  kind: 'symptom',
  trigger(text) { return ['左下腹按痛', '按左腹痛', '左腹按痛', '按天枢痛', '大肠位置按痛', '左边肚子按痛', '左下腹痛'].some(k => text.includes(k)) },
  negate(text) { return ['按肚子左腹不痛', '左腹不痛', '按哪里都不痛'].some(k => text.includes(k)) },
  ask: '是不是用手按左边肚子（大肠那一片）就会痛？'
}
