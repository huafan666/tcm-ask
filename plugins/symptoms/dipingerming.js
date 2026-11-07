module.exports = {
  name: 'dipingerming',
  title: '低频耳鸣',
  trigger(text) { return ['耳鸣'].some(k => text.includes(k)) },
  ask: '是不是低频的耳鸣，嗡嗡的，低沉的，不尖锐',
  contraindications: ['容易有持续性（早上起来的时候严重（阴不能收敛阳））']
}
