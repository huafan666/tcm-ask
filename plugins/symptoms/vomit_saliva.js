module.exports = {
  name: 'vomit_saliva',
  title: '干呕吐涎沫',
  kind: 'symptom',
  trigger(text) { return ['干呕', '吐涎沫', '干呕吐涎沫', '吐清水', '吐清涎', '干呕想吐吐不出'].some(k => text.includes(k)) },
  negate(text) { return ['不干呕', '不吐清涎'].some(k => text.includes(k)) },
  ask: '是不是想吐又吐不出东西（干呕），嘴里还老涌清口水？'
}
