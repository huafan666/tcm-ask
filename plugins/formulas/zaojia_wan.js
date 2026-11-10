module.exports = {
  name: 'zaojia_wan',
  title: '皂荚丸',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳逆上气，时时吐浊，但坐不得眠，皂荚丸主之。
  needs: [
    ['orthopnea.yes', 'foul_pus_sputum.yes'],
    ['orthopnea.yes', 'qi_upward_cough.yes']
  ],
  contraindications: ['治痰浊壅盛：咳逆气上、不停地吐稠浊的痰，一躺下就受不了，只能坐着', '皂荚一味，做成梧桐子大的小丸，用枣膏（大枣煮烂）和汤送服', '皂荚涤痰力猛，用枣膏护胃、缓和药性，是「峻药缓用」的典型', '虚弱的人、孕妇慎用；中病即止，不可久服']
}
