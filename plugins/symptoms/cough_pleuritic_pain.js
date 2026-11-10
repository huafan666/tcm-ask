module.exports = {
  name: 'cough_pleuritic_pain',
  title: '咳嗽时胁下牵扯痛',
  trigger(text) { return ['咳嗽时胁下牵扯痛', '咳唾引痛', '一咳胁下就痛', '咳嗽扯着胁下疼', '咳一下肋骨下就疼', '咳嗽时牵引着痛'].some(k => text.includes(k)) },
  negate(text) { return ['咳嗽不牵扯痛'].some(k => text.includes(k)) },
  ask: '是不是一咳嗽，两侧肋骨下面就牵扯着痛？'
}
