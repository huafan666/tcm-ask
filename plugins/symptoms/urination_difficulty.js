module.exports = {
  name: 'urination_difficulty',
  title: '小便难',
  kind: 'symptom',
  trigger(text) { return ['小便难', '小便不利', '尿难', '尿少', '尿不出来', '小便不畅', '尿不顺畅', '小便费劲', '尿得少', '小便不顺畅', '小便不通畅', '尿得费劲'].some(k => text.includes(k)) },
  negate(text) { return ['小便通畅', '小便正常', '排尿顺畅'].some(k => text.includes(k)) },
  ask: '是不是小便不顺畅、量少，或者尿不出来？'
}

