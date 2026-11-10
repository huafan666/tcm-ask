module.exports = {
  name: 'finger_arm_swelling_tremor',
  title: '手指胳膊肿还发抖',
  trigger(text) { return ['手指胳膊肿还发抖', '手指臂肿动', '手指和胳膊肿而且动', '手指发肿还跳动', '手臂肿着一阵阵抽动', '手肿还会抖'].some(k => text.includes(k)) },
  negate(text) { return ['手指胳膊不肿不抖'].some(k => text.includes(k)) },
  ask: '是不是手指和胳膊发肿，还一阵阵地抽动、发抖？'
}
