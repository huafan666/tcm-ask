module.exports = {
  name: 'restless',
  title: '躁烦',
  kind: 'symptom',
  trigger(text) { return ['躁', '烦躁', '不安', '心烦', '微烦', '心里微微发烦', '心里烦', '心里发烦', '烦得慌', '心里不痛快'].some(k => text.includes(k)) },
  negate(text) { return ['不躁', '不烦', '安静'].some(k => text.includes(k)) },
  ask: '是不是心里烦躁、坐不住、静不下来？'
}
