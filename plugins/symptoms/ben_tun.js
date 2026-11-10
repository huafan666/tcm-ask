module.exports = {
  name: 'ben_tun',
  title: '奔豚',
  kind: 'symptom',
  trigger(text) { return ['奔豚', '气从少腹上冲心', '小腹气往上冲心', '气上冲欲作奔豚', '气从少腹上冲咽喉', '气从下腹冲到嗓子', '一股气从肚子往上冲到喉咙', '发作时难受得要死', '发作欲死', '一阵气往上顶完又好了', '气往上冲到胸口', '从肚子往上冲', '一股气往上冲', '气从小腹往上顶', '气往上冲得难受', '气从肚脐往上冲'].some(k => text.includes(k)) },
  negate(text) { return ['气不上冲'].some(k => text.includes(k)) },
  ask: '是不是感觉有小股气从下腹往上冲到胸口，一阵一阵的（奔豚）？'
}

