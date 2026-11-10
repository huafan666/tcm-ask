module.exports = {
  name: 'mild_edema',
  title: '身微肿',
  trigger(text) { return ['身微肿', '有点浮肿', '轻微浮肿', '按下去有坑', '皮肤发胀'].some(k => text.includes(k)) },
  negate(text) { return ['不肿', '没有浮肿'].some(k => text.includes(k)) },
  ask: '是不是身上或腿上有点轻微浮肿，按下去会留个坑？'
}
