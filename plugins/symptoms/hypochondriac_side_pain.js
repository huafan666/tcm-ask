module.exports = {
  name: 'hypochondriac_side_pain',
  title: '一侧胁肋痛',
  trigger(text) { return ['一侧胁肋痛', '胁下偏痛', '单侧肋骨下痛', '只有一边胁下疼', '左胁下痛', '右胁下痛', '一边肋巴骨下痛'].some(k => text.includes(k)) },
  negate(text) { return ['胁肋不痛'].some(k => text.includes(k)) },
  ask: '是不是只有一侧（左或右）肋骨下面痛？'
}
