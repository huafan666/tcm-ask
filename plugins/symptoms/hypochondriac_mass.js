module.exports = {
  name: 'hypochondriac_mass',
  title: '胁下有硬块',
  trigger(text) { return ['胁下有硬块', '胁下摸到块', '肋骨下面有硬块', '胁下有痞块', '胁下有个包块', '左边肋骨下有块', '两胁有硬块', '胁下结块', '胁下摸到硬块', '肋骨下摸到块', '胁下能摸到', '肋骨下面摸到硬块', '胁下有块'].some(k => text.includes(k)) },
  negate(text) { return ['胁下没有硬块'].some(k => text.includes(k)) },
  ask: '是不是两侧肋骨下面（胁下）能摸到硬块、按着有点顶手？'
}
