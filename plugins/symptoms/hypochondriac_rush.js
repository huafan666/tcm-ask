module.exports = {
  name: 'hypochondriac_rush',
  title: '胁下有气往上冲心',
  trigger(text) { return ['胁下有气往上冲心', '胁下逆抢心', '气从肋骨下往上撞心', '两肋下有气往上顶', '胁下气往上冲', '肋骨下的气往上抢'].some(k => text.includes(k)) },
  negate(text) { return ['胁下没有气上冲'].some(k => text.includes(k)) },
  ask: '是不是感觉有气从两侧肋骨下面往上冲、一直撞到心口？'
}
