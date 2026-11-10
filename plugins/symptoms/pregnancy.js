module.exports = {
  name: 'pregnancy',
  title: '怀孕了',
  trigger(text) { return ['怀孕了', '妊娠', '有喜了', '怀上了', '孕期', '已经怀孕', '怀孕状态'].some(k => text.includes(k)) },
  negate(text) { return ['没有怀孕'].some(k => text.includes(k)) },
  ask: '是不是怀孕了？'
}
