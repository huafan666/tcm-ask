module.exports = {
  name: 'nv_lao_dan',
  title: '女劳疸',
  kind: 'summary',
  // 金匮要略·黄疸病脉证并治第十五：黄家日晡所发热，而反恶寒，此为女劳得之；膀胱急，少腹满、身尽黄，额上黑，足下热，因作黑疸。
  needs: [
    ['jaundice.yes', 'forehead_dark.yes', 'black_stool.yes'],
    ['jaundice.yes', 'tidal_fever.yes', 'cold_aversion.yes'],
    ['jaundice.yes', 'forehead_dark.yes', 'lower_abdomen_cramp.yes']
  ],
  contraindications: ['女劳疸是房劳过度、肾精亏损所致的黄疸', '原文给的辨证要点很精确：**日晡所发热而反恶寒**（傍晚发热却怕冷）、身尽黄、**额上黑**、足下热、膀胱急、少腹满、**大便必黑**、时溏', '「额上黑」和「大便必黑」是本证最有辨识度的两点', '原文特意说「此女劳之病，非水也」——虽然腹胀如水，但**不是水肿病**，别误当水气治', '原文还说「腹满者难治」——出现明显腹满说明病深', '主方硝石矾石散，但原文也承认此证难治']
}
