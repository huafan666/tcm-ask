module.exports = {
  name: 'vomit_on_food',
  title: '食谷欲呕',
  kind: 'symptom',
  trigger(text) { return ['食谷欲呕', '吃就想吐', '吃了想吐', '欲呕', '得食即呕', '进食则呕', '吃不下还想吐'].some(k => text.includes(k)) },
  negate(text) { return ['吃了不吐', '能进食不呕'].some(k => text.includes(k)) },
  ask: '不吃东西的时候或者吃了东西以后想吐，但是吐不出来什么东西'
}
