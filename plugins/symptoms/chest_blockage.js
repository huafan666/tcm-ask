module.exports = {
  name: 'chest_blockage',
  title: '胸中窒、心中结痛',
  kind: 'symptom',
  trigger(text) { return ['胸中窒', '胸中堵', '心中结痛', '胸口发堵', '胸膈憋闷'].some(k => text.includes(k)) },
  negate(text) { return ['胸不堵'].some(k => text.includes(k)) },
  ask: '是不是胸口发堵、发闷，像有东西塞住，甚至有点痛？'
}

