module.exports = {
  name: 'voice_hoarse',
  title: '声音嘶哑',
  trigger(text) { return ['声音嘶哑', '嗓子哑', '说话嘶哑', '声音哑', '嗓子嘶哑', '说话没声', '说话沙哑', '声音沙哑', '嗓子变哑', '声音变得沙哑'].some(k => text.includes(k)) },
  negate(text) { return ['声音正常', '嗓子不哑', '说话不哑'].some(k => text.includes(k)) },
  ask: '是不是说话声音变沙哑了，发不出清亮的声音？'
}
