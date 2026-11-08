module.exports = {
  name: 'ben_tun',
  title: '奔豚',
  kind: 'symptom',
  trigger(text) { return ['奔豚', '气从少腹上冲心', '小腹气往上冲心', '气上冲欲作奔豚'].some(k => text.includes(k)) },
  negate(text) { return ['气不上冲'].some(k => text.includes(k)) },
  ask: '是不是感觉有小股气从下腹往上冲到胸口，一阵一阵的（奔豚）？'
}

