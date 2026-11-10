module.exports = {
  name: 'shegan_mahuang_tang',
  title: '射干麻黄汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳而上气，喉中水鸡声，射干麻黄汤主之。
  needs: [
    ['cough.yes', 'throat_rales.yes'],
    ['qi_upward_cough.yes', 'throat_rales.yes']
  ],
  contraindications: ['治「咳而上气、喉中水鸡声」——咳嗽气逆，喉咙里有像水鸡（青蛙）叫的痰鸣音', '射干消痰利咽、麻黄宣肺平喘，配生姜、细辛、半夏温化寒痰，紫菀、款冬止咳，五味子收敛', '偏寒痰、痰多清稀的哮鸣，不是热痰', '原文服法是「先煮麻黄两沸，去上沫」，减少麻黄的发汗副作用']
}
