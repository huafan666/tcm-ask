module.exports = {
  name: 'muscle_twitching',
  title: '肌肉跳动',
  trigger(text) { return ['肌肉跳动', '肉跳', '身上肉一跳一跳', '眼皮跳不停', '肌肉不自主地跳', '肌肉一跳一跳', '肉一跳一跳', '身上一跳一跳', '肌肉突突跳', '肉在跳', '肌肉抽搐样跳'].some(k => text.includes(k)) },
  negate(text) { return ['肉不跳'].some(k => text.includes(k)) },
  ask: '是不是身上的肉会自己一跳一跳，像眼皮跳那样停不下来？'
}
