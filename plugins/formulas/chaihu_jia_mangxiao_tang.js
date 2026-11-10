module.exports = {
  name: 'chaihu_jia_mangxiao_tang',
  title: '柴胡加芒硝汤',
  kind: 'formula',
  // 104条：伤寒十三日不解，胸胁满而呕，日晡所发潮热，已而微利……先宜小柴胡汤以解外，后以柴胡加芒硝汤主之。
  needs: ['hypochondriac_fullness.yes', 'vomiting.yes', 'tidal_fever.yes'],
  contraindications: ['104条：胸胁满而呕、日晡所发潮热，误下后微利', '小柴胡汤加芒硝，和解兼软坚', '原文「先宜小柴胡汤以解外，后以柴胡加芒硝汤」——里实已成才加芒硝', '⚠ 原文作「先宜小柴胡汤以解外，后以柴胡加芒硝汤主之」，是一条里的两步治法，不是两个并列方证']
}
