module.exports = {
  name: 'semen_loss',
  title: '遗精',
  trigger(text) { return ['遗精', '失精', '滑精', '夜里漏精', '梦遗', '精气自出', '不自主射精'].some(k => text.includes(k)) },
  negate(text) { return ['没有遗精'].some(k => text.includes(k)) },
  ask: '是不是会有精液不自主地流出来，尤其在夜里或做梦时？'
}
