module.exports = {
  name: 'kushen_tang_xi',
  title: '苦参汤（外洗）',
  kind: 'formula',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：蚀于下部则咽干，苦参汤洗之。
  needs: ['genital_ulcer.yes', 'throat_dry.yes'],
  contraindications: ['狐惑病溃烂在前阴（下身）的时候用，是外洗方，不是喝的', '原文还配了一句「蚀于下部则咽干」——下面的湿热上冲，嗓子跟着发干', '苦参清热燥湿杀虫，煎汤熏洗患处']
}
