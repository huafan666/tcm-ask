module.exports = {
  name: 'gu_dan',
  title: '谷疸',
  kind: 'summary',
  // 金匮要略·黄疸病脉证并治第十五：谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸，茵陈蒿汤主之。
  needs: [
    ['jaundice.yes', 'low_appetite.yes', 'dizziness.yes'],
    ['jaundice.yes', 'cold_aversion.yes', 'low_appetite.yes'],
    ['jaundice.yes', 'chest_qi_stuffiness.yes', 'abdominal_fullness.yes']
  ],
  contraindications: ['谷疸是饮食不节、脾胃受伤、湿热内蕴所致的黄疸', '原文三要素：**寒热、不食、食即头眩、心胸不安**——先有恶寒发热、吃不下，一吃就头晕、心下不舒服', '「久久发黄」说明不是一两天，湿热积久了才发黄', '与酒疸的区别：谷疸是吃出来的，酒疸是喝出来的（饮酒过度）', '主方茵陈蒿汤（茵陈、栀子、大黄），清热利湿退黄']
}
