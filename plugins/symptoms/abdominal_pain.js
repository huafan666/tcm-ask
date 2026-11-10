module.exports = {
  name: 'abdominal_pain',
  title: '腹痛(时痛)',
  kind: 'symptom',
  trigger(text) { return ['腹痛', '肚子痛', '腹时痛', '时腹痛', '肚痛', '腹隐痛', '肚子隐痛', '一按就痛', '按着痛', '按下去痛', '肚子疼', '腹部疼痛', '肚腹疼痛'].some(k => text.includes(k)) },
  negate(text) { return ['腹不痛', '肚子不痛'].some(k => text.includes(k)) },
  ask: '是不是肚子一阵一阵地痛，时痛时止，揉一揉、按一按反而舒服些？'
}
