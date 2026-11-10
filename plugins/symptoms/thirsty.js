module.exports = {
  name: 'thirsty',
  title: '口渴',
  kind: 'symptom',
  trigger(text) { return ['口渴', '口干', '想喝水', '口很渴', '很渴', '渴得厉害', '大烦渴', '烦渴', '大渴', '喝水不解渴', '越喝越渴', '喝很多水还是渴', '喝水也不解', '口大渴'].some(k => text.includes(k)) },
  negate(text) { return ['不渴', '口干不想喝'].some(k => text.includes(k)) },
  ask: '是不是嘴里发干、老想喝水？'
}
