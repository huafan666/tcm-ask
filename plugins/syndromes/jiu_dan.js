module.exports = {
  name: 'jiu_dan',
  title: '酒疸',
  kind: 'summary',
  // 金匮要略·黄疸病脉证并治第十五：夫病酒黄疸，必小便不利，其候心中热，足下热，是其证也。酒黄疸，心中懊憹或热痛，栀子大黄汤主之。
  needs: [
    ['jaundice.yes', 'heart_hot.yes'],
    ['jaundice.yes', 'heart_hot.yes', 'urination_difficulty.yes'],
    ['jaundice.yes', 'vex_insomnia.yes'],
    ['jaundice.yes', 'heart_hot.yes', 'vomiting.yes']
  ],
  contraindications: ['酒疸是饮酒过度、湿热内蕴引起的黄疸', '原文的关键描述：**小便不利、心中热、足下热**——心里热、脚心也热，这是酒疸的特点', '还有「心中懊憹或热痛」——心里烦闷得坐立不安，甚至热痛', '原文另给了治法分岔：「其脉浮者先吐之，沉弦者先下之」——病位偏上先吐、偏下先下', '⚠ 原文警告：「酒疸下之，久久为黑疸」——用下法不当会转成更难治的黑疸', '要戒酒，不戒酒光吃药没用']
}
