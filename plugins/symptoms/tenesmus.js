module.exports = {
  name: 'tenesmus',
  title: '里急后重(下重)',
  kind: 'symptom',
  trigger(text) { return ['里急后重', '下重', '想拉拉不出', '拉完还想拉', '肛门坠胀', '大便后重'].some(k => text.includes(k)) },
  negate(text) { return ['大便通畅', '无后重'].some(k => text.includes(k)) },
  ask: '是不是想大便又拉不出来、总想拉(里急后重)？热利下重是白头翁汤证。'
}
