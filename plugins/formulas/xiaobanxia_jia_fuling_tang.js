module.exports = {
  name: 'xiaobanxia_jia_fuling_tang',
  title: '小半夏加茯苓汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：卒呕吐，心下痞，膈间有水，眩悸者，小半夏加茯苓汤主之。
  needs: [
    ['vomiting.yes', 'dizziness.yes', 'heart_palp.yes'],
    ['vomiting.yes', 'epigastric_lump_soft.yes', 'dizziness.yes']
  ],
  contraindications: ['治膈间有水：突然呕吐、心口发痞堵、头晕、心慌', '就是小半夏汤加茯苓——加茯苓是关键，因为要**利水**，不只是止呕', '和小半夏汤的区别：小半夏汤只管呕吐（水饮在上），本方多了眩、悸，说明水饮已经影响到心', '方后注说「小便利则愈」——小便一通，水有出路，病就好了']
}
