module.exports = {
  name: 'dian_kuang',
  title: '癫狂',
  kind: 'summary',
  // 金匮要略·五脏风寒积聚病脉证并治第十一：邪哭使魂魄不安者，血气少也……心气虚者，其人则畏，合目欲眠，梦远行而精神离散，魂魄妄行。阴气衰者为癫，阳气衰者为狂。
  needs: [
    ['low_energy.yes', 'sleepy.yes', 'delirium.yes'],
    ['low_energy.yes', 'sleepy.yes'],
    ['manic.yes', 'aimless_walking.yes'],
    ['manic.yes', 'self_talk_ceaseless.yes']
  ],
  contraindications: ['癫和狂是两种相反的表现，原文用一句话点明：「阴气衰者为癫，阳气衰者为狂」', '癫偏阴：情绪低落、无故恐惧（心气虚则畏）、闭眼想睡、做梦远行、精神涣散', '狂偏阳：躁动发狂、到处乱走、自言自语', '共同根源是「血气少」——气血不足、心神失养，魂魄不安', '和阳明实热发狂（大承气汤证）区别：那种有腹满硬痛、大便不通、潮热谵语，属实']
}
