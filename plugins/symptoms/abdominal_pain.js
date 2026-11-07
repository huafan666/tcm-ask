module.exports = {
  name: 'abdominal_pain',
  title: '腹痛(时痛)',
  kind: 'symptom',
  trigger(text) { return ['腹痛', '肚子痛', '腹时痛', '时腹痛', '肚痛', '腹隐痛', '肚子隐痛'].some(k => text.includes(k)) },
  negate(text) { return ['腹不痛', '肚子不痛'].some(k => text.includes(k)) },
  ask: '会不会肚子痛？时痛(一阵一阵/隐痛)多为太阴虚寒；大实痛(拒按剧痛)才是实证。'
}
