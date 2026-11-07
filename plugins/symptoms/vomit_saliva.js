module.exports = {
  name: 'vomit_saliva',
  title: '干呕吐涎沫',
  kind: 'symptom',
  trigger(text) { return ['干呕', '吐涎沫', '干呕吐涎沫', '吐清水', '吐清涎', '干呕想吐吐不出'].some(k => text.includes(k)) },
  negate(text) { return ['不干呕', '不吐清涎'].some(k => text.includes(k)) },
  ask: '是不是干呕(想吐吐不出)、嘴里涌清口水/涎沫？干呕吐涎沫+头痛是吴茱萸汤。'
}
