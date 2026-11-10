module.exports = {
  name: 'gan_zhu',
  title: '肝著',
  kind: 'summary',
  // 金匮要略·五脏风寒积聚病脉证并治第十一：肝著，其人常欲蹈其胸上，先未苦时，但欲饮热，旋覆花汤主之。
  needs: [
    ['desire_to_press_chest.yes'],
    ['desire_to_press_chest.yes', 'chest_qi_stuffiness.yes'],
    ['desire_to_press_chest.yes', 'hypochondriac_fullness.yes']
  ],
  contraindications: ['肝著是肝经气血郁滞、着而不行，最形象的表现就是「常欲蹈其胸上」——总想捶一捶胸口', '原文还说「先未苦时，但欲饮热」——还没严重时只想喝热的，说明是寒凝气滞', '病位在肝（两胁、胸中），病性是气滞血瘀', '和胸痹的区别：胸痹是胸阳不通、胸背痛为主；肝著是气机郁着、以「想捶胸口」为特点']
}
