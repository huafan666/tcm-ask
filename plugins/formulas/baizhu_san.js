module.exports = {
  name: 'baizhu_san',
  title: '白术散',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妊娠养胎，白术散主之。
  needs: [
    ['pregnancy.yes', 'cold_aversion.yes'],
    ['pregnancy.yes', 'low_appetite.yes'],
    ['pregnancy.yes', 'abdominal_cramp_after_birth.yes']
  ],
  contraindications: ['妊娠养胎方，偏**脾虚寒湿**者', '四味：白术、川芎、蜀椒（去汗）、牡蛎——健脾、温中、安胎', '原文「但苦痛，加芍药；心下毒痛，倍加芎藭；心烦吐痛不能食饮，加细辛一两、半夏大者二十枚」——有随症加减法', '和当归散的区别：当归散偏血虚有热，白术散偏脾虚寒湿（蜀椒温中）', '⚠ 蜀椒辛热，阴虚有热者不宜；同样**不建议无症状孕妇长期服用**']
}
