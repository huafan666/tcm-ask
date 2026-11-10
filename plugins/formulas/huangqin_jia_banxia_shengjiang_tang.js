module.exports = {
  name: 'huangqin_jia_banxia_shengjiang_tang',
  title: '黄芩加半夏生姜汤',
  kind: 'formula',
  // 第172条: 太阳与少阳合病，自下利者与黄芩汤；若呕者，黄芩加半夏生姜汤主之。
  // 黄芩汤证兼呕。核心=下利+呕。
  needs: [
    ['diarrhea.yes', 'vomiting.yes', 'cold_aversion.no', 'clear_grain_diarrhea.no'],
    ['diarrhea.yes', 'vomiting.yes', 'hypochondriac_fullness.yes', 'cold_aversion.no', 'clear_grain_diarrhea.no'],
    // 金匮第十七篇 呕吐哕下利 对应条文
    ['vomiting.yes','diarrhea.yes']
  ],
  contraindications: ['太阳少阳合病下利而呕', '清热止利加和胃止呕']
}
