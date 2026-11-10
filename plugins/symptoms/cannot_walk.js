module.exports = {
  name: 'cannot_walk',
  title: '想走走不动',
  trigger(text) { return ['想走走不动', '想动又动不了', '想出门走不动', '懒得动又坐不住', '想起来走又没劲'].some(k => text.includes(k)) },
  negate(text) { return ['行动自如'].some(k => text.includes(k)) },
  ask: '是不是想起来走走、活动一下，可又觉得没劲、走不动？'
}
