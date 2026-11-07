module.exports = {
  name: 'zhufu_tang',
  title: '猪肤汤',
  kind: 'formula',
  // 第310条: 少阴病下利咽痛胸满心烦猪肤汤主之。
  // 少阴下利阴虚,咽痛+胸满+心烦。核心=下利+咽痛+心烦。
  needs: [
    ['diarrhea.yes', 'throat_pain.yes', 'restless.yes', 'cold_aversion.no']
  ],
  contraindications: ['少阴下利+咽痛+心烦(阴虚)', '润燥利咽(猪肤蜜米粉)', '与甘草桔梗区别(彼单纯咽痛不下利)']
}
