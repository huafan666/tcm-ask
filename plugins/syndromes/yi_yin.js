module.exports = {
  name: 'yi_yin',
  title: '溢饮',
  kind: 'summary',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：饮水流行，归于四肢，当汗出而不汗出，身体疼重，谓之溢饮……病溢饮者，当发其汗。
  needs: [
    ['body_pain.yes', 'body_heavy.yes', 'no_sweat.yes'],
    ['body_pain.yes', 'body_heavy.yes']
  ],
  contraindications: ['四饮之一。溢饮是水饮泛溢到**四肢肌表**，所以叫「溢」', '关键三句：水归四肢、当汗出而不汗出、身体疼重', '治法原文说得非常明确：「当发其汗」——水在表就要从表解，用发汗法', '大青龙汤（偏表实有热）、小青龙汤（偏寒饮）都能用', '和水肿的区别：溢饮以身体疼重为主，不一定是明显可凹性水肿']
}
