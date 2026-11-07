module.exports = {
  name: 'snoring',
  title: '鼻息鼾声',
  kind: 'symptom',
  trigger(text) { return ['鼻鼾', '鼻息鼾', '鼾声', '出气重带鼾', '昏睡鼾'].some(k => text.includes(k)) },
  negate(text) { return ['无鼾声', '呼吸平稳无鼾'].some(k => text.includes(k)) },
  ask: '是不是出现病态的鼻息鼾声——昏沉/困重的时候出气粗重、带着鼾响？这是津窍失养，不是普通睡觉打呼噜。'
}

