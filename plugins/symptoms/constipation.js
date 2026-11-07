module.exports = {
  name: 'constipation',
  title: '便秘',
  kind: 'symptom',
  trigger(text) { return ['大便硬', '不大便', '便秘', '大便难', '拉不出来', '大便干结', '数日不大便', '大便几日一行', '燥屎'].some(k => text.includes(k)) },
  negate(text) { return ['大便通', '大便正常', '能大便', '大便软', '大便溏'].some(k => text.includes(k)) }
}
