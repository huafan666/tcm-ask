module.exports = {
  name: 'vomit_on_food',
  title: '食谷欲呕',
  kind: 'symptom',
  trigger(text) { return ['食谷欲呕', '吃就想吐', '吃了想吐', '欲呕', '得食即呕', '进食则呕', '吃不下还想吐'].some(k => text.includes(k)) },
  negate(text) { return ['吃了不吐', '能进食不呕'].some(k => text.includes(k)) },
  ask: '是不是一吃东西就想吐，却又吐不出什么？'
}
