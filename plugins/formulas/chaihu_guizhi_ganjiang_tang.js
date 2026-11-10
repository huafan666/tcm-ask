module.exports = {
  name: 'chaihu_guizhi_ganjiang_tang',
  title: '柴胡桂枝干姜汤',
  kind: 'formula',
  // 第147条: 伤寒五六日已发汗而复下之，胸胁满微结，小便不利，渴而不呕，但头汗出，往来寒热，心烦者，柴胡桂枝干姜汤主之。
  // 少阳兼水饮寒化: 胸胁满微结+小便不利+渴不呕+往来寒热。
  needs: [
    ['alternating_cold_heat.yes', 'urination_difficulty.yes'],
    ['hypochondriac_fullness.yes', 'urination_difficulty.yes'],
    // 147条「胸胁满微结，小便不利，渴而**不呕**」——「不呕」是用来和大小柴胡汤划界限的：
    // 大柴胡汤有呕、小柴胡汤有心烦喜呕，本方偏偏不呕（水饮在胸胁、不在胃）
    ['hypochondriac_fullness.yes', 'urination_difficulty.yes', 'vomiting.no']
  ],
  contraindications: ['胸胁满微结', '小便不利、渴不呕(水饮)', '往来寒热而心烦', '和解温化水饮']
}
