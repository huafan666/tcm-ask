module.exports = {
  name: 'vex_like_vomit',
  title: '心烦喜呕',
  kind: 'symptom',
  trigger(text) { return ['心烦喜呕', '心烦想呕', '烦并且想吐'].some(k => text.includes(k)) },
  negate(text) { return ['不烦不呕'].some(k => text.includes(k)) },
  ask: '是不是心里烦，还老想吐？'
}

