module.exports = {
  name: 'fever',
  title: '发热',
  kind: 'symptom',
  trigger(text) { return ['发热', '发烧', '体温高', '有点烧'].some(k => text.includes(k)) },
  ask: '是不是身上发热、摸着发烫，或者量体温偏高？'
}
