module.exports = {
  name: 'tingli_dazao_xiefei_tang',
  title: '葶苈大枣泻肺汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：肺痈，喘不得卧，葶苈大枣泻肺汤主之。
  needs: [
    ['orthopnea.yes', 'cough.yes'],
    ['orthopnea.yes', 'foul_pus_sputum.yes'],
    ['fei_yong.yes', 'orthopnea.yes'],
    // 金匮 12.28：支饮不得息，葶苈大枣泻肺汤主之
    ['zhi_yin.yes','orthopnea.yes']
  ],
  contraindications: ['治肺痈「喘不得卧」——痰涎壅塞肺中，一躺下就喘不上气', '葶苈子泻肺逐痰、开泄肺气，大枣护脾胃、防泻下太过', '「泻肺」不是「泻下」：目的是把壅塞在肺里的痰浊排掉', '体虚的人慎用，中病即止']
}
