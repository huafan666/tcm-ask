module.exports = {
  name: 'gualou_xiebai_banxia_tang',
  title: '栝蒌薤白半夏汤',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：胸痹不得卧，心痛彻背者，栝蒌薤白半夏汤主之。
  needs: [
    ['orthopnea.yes', 'heart_pain_radiate.yes'],
    ['chest_back_pain.yes', 'orthopnea.yes']
  ],
  contraindications: ['比栝蒌薤白白酒汤更重：不但胸背痛，还「不得卧」（躺不平）、心痛透到后背', '即白酒汤加半夏——痰浊更重，加半夏化痰降逆', '白酒用量也加大（一斗），取通行阳气之力更强', '出现不得卧说明痰浊壅盛已影响呼吸']
}
