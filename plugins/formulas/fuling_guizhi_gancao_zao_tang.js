module.exports = {
  name: 'fuling_guizhi_gancao_zao_tang',
  title: '茯苓桂枝甘草大枣汤',
  kind: 'formula',
  // 第65条: 发汗后其人脐下悸者，欲作奔豚，茯苓桂枝甘草大枣汤主之。
  needs: [
    ['below_palp.yes', 'ben_tun.yes'],
    ['below_palp.yes', 'qi_surge.yes'],
    ['below_palp.yes', 'urination_difficulty.yes']
  ],
  contraindications: ['发汗后脐下悸(水饮)', '欲作奔豚', '苓桂甘枣治水气']
}
