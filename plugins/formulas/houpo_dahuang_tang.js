module.exports = {
  name: 'houpo_dahuang_tang',
  title: '厚朴大黄汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：支饮胸满者，厚朴大黄汤主之。
  needs: [
    ['zhi_yin.yes', 'chest_qi_stuffiness.yes'],
    ['chest_qi_stuffiness.yes', 'constipation.yes', 'tan_yin.yes']
  ],
  contraindications: ['治支饮而胸腹胀满属实证者', '厚朴、大黄、枳实三味——就是小承气汤的变方，但**厚朴用量特别大**（一尺），重在行气除满', '和厚朴三物汤、小承气汤同为「朴枳黄」组合，区别在剂量侧重：本方重在开胸除满', '体虚、无实满者不宜']
}
