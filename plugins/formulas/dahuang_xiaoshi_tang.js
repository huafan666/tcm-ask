module.exports = {
  name: 'dahuang_xiaoshi_tang',
  title: '大黄硝石汤',
  kind: 'formula',
  // 金匮要略·黄疸病脉证并治第十五：黄疸腹满，小便不利而赤，自汗出，此为表和里实，当下之，宜大黄硝石汤。
  needs: [
    ['jaundice.yes', 'abdominal_fullness.yes', 'urination_difficulty.yes'],
    ['jaundice.yes', 'abdominal_fullness.yes', 'sweat.yes']
  ],
  contraindications: ['治黄疸的**里实证**：腹满、小便不利而色赤、自汗出', '原文的辨证结论很明确：「此为**表和里实**，当下之」——表无病、里有实结，所以要攻下', '四味：大黄、硝石、黄柏、栀子——清热通腑、利湿退黄', '「自汗出」在这里不是表虚，而是里热蒸腾迫汗外出的表现，不能因为出汗就以为是表证', '体虚、孕妇忌用；得下即停']
}
