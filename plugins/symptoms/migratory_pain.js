module.exports = {
  name: 'migratory_pain',
  title: '疼痛游走不定',
  trigger(text) { return ['疼痛游走不定', '痛处会跑', '疼痛转移', '一阵这儿痛一阵那儿痛', '展转痛移', '疼的地方会变', '游走性疼痛', '痛的地方老变', '一会儿这儿疼一会儿那儿疼', '疼痛跑来跑去'].some(k => text.includes(k)) },
  negate(text) { return ['痛处固定'].some(k => text.includes(k)) },
  ask: '是不是疼的地方会转移、一会儿这里一会儿那里，时发时止？'
}
