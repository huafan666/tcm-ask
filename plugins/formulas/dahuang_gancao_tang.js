module.exports = {
  name: 'dahuang_gancao_tang',
  title: '大黄甘草汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：食已即吐者，大黄甘草汤主之。
  needs: [
    ['vomit_right_after_eating.yes'],
    ['vomit_right_after_eating.yes', 'constipation.yes']
  ],
  contraindications: ['治「食已即吐」——刚吃完马上就吐，和胃反的「隔很久才吐」正好相反', '只有两味：大黄、甘草。「食已即吐」是胃肠有实热、下窍不通，浊气上逆，所以用大黄通下、甘草缓中，**大便一通、浊气下行，呕吐自止**', '这是「欲降先通」～「下病上取」的思路：治呕吐却用泻下药', '体虚、孕妇慎用；中病即止']
}
