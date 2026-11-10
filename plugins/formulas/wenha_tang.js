module.exports = {
  name: 'wenha_tang',
  title: '文蛤汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：吐后，渴欲得水而贪饮者，文蛤汤主之。兼主微风、脉紧、头痛。
  needs: [
    ['vomiting.yes', 'severe_thirst.yes'],
    ['vomiting.yes', 'severe_thirst.yes', 'wind_aversion.yes']
  ],
  contraindications: ['治吐后「渴欲得水而贪饮」——吐完渴得厉害、贪喝不停', '组成是文蛤 + 麻黄杏仁甘草石膏汤：文蛤（海蛤壳）咸寒生津止渴，麻杏石甘汤清宣郁热', '原文还说「兼主微风、脉紧、头痛」——兼有表证头痛也能治', '和文蛤散的区别：文蛤散只治「渴欲饮水不止」（单纯津伤）；本方兼有内热与表证', '注意：本方偏寒凉，虚寒者不宜']
}
