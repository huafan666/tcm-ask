module.exports = {
  name: 'clear_grain_diarrhea',
  title: '下利清谷',
  kind: 'symptom',
  trigger(text) { return ['下利清谷', '拉未消化食物', '完谷不化', '拉出未消化的'].some(k => text.includes(k)) },
  negate(text) { return ['大便成形'].some(k => text.includes(k)) },
  ask: '是不是拉肚子，拉出来的还有没消化的食物？'
}

