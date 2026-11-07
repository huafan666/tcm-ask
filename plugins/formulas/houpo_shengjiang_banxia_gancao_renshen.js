module.exports = {
  name: 'houpo_shengjiang_banxia_gangcao_renshen',
  title: '厚朴生姜半夏甘草人参汤',
  kind: 'formula',
  // 第66条: 发汗后，腹胀满者，厚朴生姜半夏甘草人参汤主之。
  needs: [
    ['abdominal_fullness.yes', 'abdominal_pain.no']
  ],
  contraindications: ['发汗后腹胀满', '行气除满、和胃', '脾虚气滞腹胀', '不兼腹痛(与小建中区别)']
}
