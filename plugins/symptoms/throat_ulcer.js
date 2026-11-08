module.exports = {
  name: 'throat_ulcer',
  title: '咽中生疮',
  kind: 'symptom',
  trigger(text) { return ['咽中生疮', '咽喉生疮', '喉咙长疮', '咽有疮', '咽喉溃烂'].some(k => text.includes(k)) },
  negate(text) { return ['咽喉没疮', '喉咙没长疮'].some(k => text.includes(k)) },
  ask: '是不是喉咙里长疮、溃烂，疼得厉害？'
}
