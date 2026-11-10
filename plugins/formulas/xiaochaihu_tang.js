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
    ['vex_like_vomit.yes'],
    // 金匮第十七篇 呕吐哕下利 对应条文
    ['vomiting.yes','fever.yes'],
    // 金匮 22.1：妇人中风……经水适断，此为热入血室……小柴胡汤主之
    ['alternating_cold_heat.yes','vaginal_bleeding.yes']
  ],
  contraindications: ['但见一证便是(往来寒热/胸胁苦满/不欲食/心烦喜呕任一)', '少阳半表半里主方', '和解少阳']
}
