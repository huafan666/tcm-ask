module.exports = {
  name: 'anal_ulcer',
  title: '肛门溃烂',
  trigger(text) { return ['肛门溃烂', '肛门溃疡', '肛口溃烂', '肛周溃烂', '肛门口溃烂', '肛门长疮', '肛门也烂了', '肛门烂了', '肛门烂', '肛门破皮', '肛口烂', '屁股眼烂'].some(k => text.includes(k)) },
  negate(text) { return ['肛门正常', '肛门没事'].some(k => text.includes(k)) },
  ask: '是不是肛门那里有溃烂、破皮的地方？'
}
