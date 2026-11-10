module.exports = {
  name: 'bawei_shenqi_wan',
  title: '八味肾气丸',
  kind: 'formula',
  // 金匮要略·血痹虚劳病脉证并治第六：虚劳腰痛，少腹拘急，小便不利者，八味肾气丸主之。
  needs: [
    ['yaosuan.yes', 'lower_abdomen_cramp.yes'],
    ['yaosuan.yes', 'urination_difficulty.yes'],
    ['lower_abdomen_cramp.yes', 'urination_difficulty.yes'],
    // 金匮 12.18：夫短气有微饮，当从小便去之……肾气丸亦主之
    ['short_breath.yes','yaosuan.yes'],
    // 金匮 13.4：男子消渴，小便反多，以饮一斗，小便一斗，肾气丸主之
    ['thirsty.yes','polyuria.yes']
  ],
  contraindications: ['治肾虚型的虚劳：腰酸腰痛、小肚子拘急、小便不顺畅', '八味＝六味地黄丸加桂枝（或肉桂）、附子——在滋补肾阴的基础上温阳化气', '治法是「少火生气」：用少量温药慢慢化生肾气，不是猛补阳', '小便不利而口渴、或夜尿多，都属于这个方向']
}
