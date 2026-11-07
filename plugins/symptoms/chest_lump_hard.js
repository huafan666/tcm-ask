module.exports = {
  name: 'chest_lump_hard',
  title: '胸中痞硬',
  kind: 'symptom',
  trigger(text) { return ['胸中痞硬', '胸口堵硬', '胸中闷硬', '气上冲咽喉'].some(k => text.includes(k)) },
  negate(text) { return ['胸不堵'].some(k => text.includes(k)) }
}

