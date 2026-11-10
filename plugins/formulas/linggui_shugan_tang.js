module.exports = {
  name: 'linggui_shugan_tang',
  title: '茯苓桂枝白术甘草汤(苓桂术甘汤)',
  kind: 'formula',
  // 第67条: 伤寒若吐若下后，心下逆满，气上冲胸，起则头眩…茯苓桂枝白术甘草汤主之。
  // 中阳不足水饮上犯: 气上冲+头眩+心下逆满。核心=气上冲+头眩。
  needs: [
    ['qi_surge.yes', 'dizziness.yes'],
    ['qi_surge.yes', 'epigastric_fullness.yes'],
    // 金匮 12.17：心下有痰饮，胸胁支满，目眩，苓桂术甘汤主之
    ['hypochondriac_fullness.yes', 'dizziness.yes'],
    ['dizziness.yes', 'epigastric_lump_soft.yes']
  ],
  contraindications: ['中阳不足、水饮上泛', '气上冲胸+起则头眩', '苓桂术甘温阳化饮']
}
