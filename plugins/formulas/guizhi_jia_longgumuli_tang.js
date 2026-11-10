module.exports = {
  name: 'guizhi_jia_longgumuli_tang',
  title: '桂枝加龙骨牡蛎汤',
  kind: 'formula',
  // 金匮要略·血痹虚劳病脉证并治第六：夫失精家少腹弦急，阴头寒，目眩，发落……男子失精，女子梦交，桂枝加龙骨牡蛎汤主之。
  needs: [
    ['semen_loss.yes', 'lower_abdomen_cramp.yes'],
    ['dream_sex.yes', 'lower_abdomen_cramp.yes'],
    ['semen_loss.yes', 'genital_cold.yes'],
    ['semen_loss.yes', 'dizziness.yes', 'tuofa.yes'],
    ['dream_sex.yes', 'dizziness.yes']
  ],
  contraindications: ['治「失精家」：频繁遗精或梦交，伴有小肚子抽紧、前阴发凉、头晕、掉头发', '病机是阴阳两虚、精关不固，心神浮越——所以要既调阴阳又重镇安神', '即桂枝汤加龙骨、牡蛎，桂枝汤调和阴阳，龙牡收敛固涩、镇摄浮阳', '注意与桂枝甘草龙骨牡蛎汤（火逆烦躁）区别：那条是误治后的烦躁，没有失精梦交']
}
