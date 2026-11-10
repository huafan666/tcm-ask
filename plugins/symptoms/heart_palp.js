module.exports = {
  name: 'heart_palp',
  title: '心悸',
  kind: 'symptom',
  trigger(text) { return ['心悸', '心动悸', '心下悸', '心慌', '心窝跳', '心口发悸', '心跳漏拍', '阵发性心悸', '心跳忽快忽慢', '脉结代', '心里发慌', '心里慌', '心慌得厉害', '心跳得厉害', '心跳不安', '心口窝跳动', '心跳', '心跳乱', '心砰砰跳', '心里发跳'].some(k => text.includes(k)) },
  negate(text) { return ['不悸', '心不跳'].some(k => text.includes(k)) },
  ask: '是不是心里发慌、心跳得厉害，有时还忽快忽慢、像漏了一拍（心悸/脉结代）？'
}

