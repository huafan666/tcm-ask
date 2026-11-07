module.exports = {
  name: 'xiaoqinglong_tang',
  title: '小青龙汤',
  kind: 'formula',
  // 第40/41条: 伤寒表不解心下有水气，干呕发热而咳；或渴或利或噎或喘。心下有水气，咳而微喘发热不渴。
  // 核心=水饮犯肺胃: 干呕+咳。强调不渴(心下有水气不爱喝水)。发热可为伴随。
  needs: [
    ['vomiting.yes', 'cough.yes'],
    ['vomiting.yes', 'cough.yes', 'thirsty.no'],
    ['cough.yes', 'no_sweat.yes']
  ],
  contraindications: ['心下有水气(水饮)为主', '干呕+咳，平时不爱喝水(不渴)', '发热或可不热', '水饮化热后渴则寒去欲解']
}

