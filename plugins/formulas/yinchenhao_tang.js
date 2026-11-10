module.exports = {
  name: 'yinchenhao_tang',
  title: '茵陈蒿汤',
  kind: 'formula',
  // 第236/260条: 身黄如橘子色小便不利腹微满者茵陈蒿汤主之。
  // 阳黄湿热(瘀热在里)。核心=身黄(鲜明橘子色)+小便不利(+腹微满)。
  needs: [
    ['jaundice.yes', 'urination_difficulty.yes'],
    // 金匮 15.13：谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸，茵陈蒿汤主之
    ['gu_dan.yes']
  ],
  contraindications: ['身黄如橘子色+小便不利+腹微满(湿热阳黄)', '利湿退黄(茵陈栀子大黄)', '小便当利黄从小便去']
}
