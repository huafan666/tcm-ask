module.exports = {
  name: 'tenesmus',
  title: '里急后重(下重)',
  kind: 'symptom',
  trigger(text) { return ['里急后重', '下重', '想拉拉不出', '拉完还想拉', '肛门坠胀', '大便后重'].some(k => text.includes(k)) },
  negate(text) { return ['大便通畅', '无后重'].some(k => text.includes(k)) },
  ask: '是不是总想大便、急着要拉，蹲下去又拉不出来（里急后重）？'
}
