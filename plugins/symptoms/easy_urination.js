module.exports = {
  name: 'easy_urination',
  title: '小便自利',
  kind: 'symptom',
  trigger(text) { return ['小便自利', '小便通畅', '尿得顺畅', '小便正常能排', '小便很通畅', '小便通利', '小便顺畅'].some(k => text.includes(k)) },
  negate(text) { return ['小便不利', '小便难'].some(k => text.includes(k)) },
  ask: '是不是小便很通畅、量也正常，没有排不出的感觉？'
}

