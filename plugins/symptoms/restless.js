module.exports = {
  name: 'restless',
  title: '躁烦',
  kind: 'symptom',
  trigger(text) { return ['躁', '烦躁', '不安', '心烦'].some(k => text.includes(k)) },
  negate(text) { return ['不躁', '不烦', '安静'].some(k => text.includes(k)) }
}
