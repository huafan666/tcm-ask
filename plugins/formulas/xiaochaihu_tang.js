module.exports = {
  name: 'xiaochaihu_tang',
  title: '小柴胡汤',
  kind: 'formula',
  // 第96/97/99条: 少阳半表半里，往来寒热，胸胁苦满，默默不欲饮食，心烦喜呕。
  // 第101条关键: 但见一证便是，不必悉具。→ 多路径OR，任一少阳主证即可。
  needs: [
    ['alternating_cold_heat.yes'],
    ['hypochondriac_fullness.yes'],
    ['low_appetite.yes'],
    ['vex_like_vomit.yes']
  ],
  contraindications: ['但见一证便是(往来寒热/胸胁苦满/不欲食/心烦喜呕任一)', '少阳半表半里主方', '和解少阳']
}
