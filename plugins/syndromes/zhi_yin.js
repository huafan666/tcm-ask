module.exports = {
  name: 'zhi_yin',
  title: '支饮',
  kind: 'summary',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：咳逆倚息，气短不得卧，其形如肿，谓之支饮……膈间支饮，其人喘满，心下痞坚，面色黧黑。
  needs: [
    ['cough.yes', 'orthopnea.yes'],
    ['orthopnea.yes', 'chest_qi_stuffiness.yes'],
    ['orthopnea.yes', 'face_black.yes']
  ],
  contraindications: ['四饮之一。支饮是水饮支撑在**胸膈**，阻碍肺气升降，所以叫「支」', '典型表现：咳逆倚息不得卧——咳得厉害、只能靠着坐、躺不平，外形看着像肿了', '久病的支饮会出现「喘满、心下痞坚、面色黧黑」，说明水饮结得深、血行也不畅了', '对应现代医学的慢性心衰、肺心病、胸腔积液等可出现类似表现', '⚠ 躺不平、喘得厉害、面唇发绀，是心功能不全的常见信号，必须及时就医']
}
