module.exports = {
  name: 'heart_palpitation',
  title: '心动悸',
  kind: 'symptom',
  trigger(text) { return ['心动悸', '心悸明显', '心跳漏拍', '阵发性心悸', '脉结代'].some(k => text.includes(k)) },
  negate(text) { return ['心不悸'].some(k => text.includes(k)) },
  ask: '是不是心悸很厉害、心跳忽快忽停、像漏了一拍(脉结代)?'
}

