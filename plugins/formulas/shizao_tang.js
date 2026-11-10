module.exports = {
  name: 'shizao_tang',
  title: '十枣汤',
  kind: 'formula',
  // 第152条: 太阳中风下利呕逆，心下痞硬满引胁下痛，干呕短气，汗出不恶寒，此表解里未和，十枣汤主之。
  // 悬饮. 核心=心下痞硬满引胁下痛(水饮停胁).
  needs: [
    // 152条「汗出不恶寒者，此表解里未和也」——不恶寒是判定表已解、可以攻里的前提
    ['epigastric_lump_soft.yes', 'hypochondriac_fullness.yes', 'cold_aversion.no'],
    ['cough.yes', 'hypochondriac_fullness.yes'],
    // 金匮 12.23：病悬饮者，十枣汤主之
    ['xuan_yin.yes']
  ],
  contraindications: ['心下痞硬满引胁下痛(悬饮)', '干呕短气', '峻下逐水(芫花甘遂大戟)', '平旦服']
}
