module.exports = {
  name: 'fangji_dihuang_tang',
  title: '防己地黄汤',
  kind: 'formula',
  // 金匮要略·中风历节病脉证并治第五：防己地黄汤治病如狂状，妄行，独语不休，无寒热，其脉浮。
  needs: [
    ['self_talk_ceaseless.yes', 'aimless_walking.yes', 'fever.no'],
    ['self_talk_ceaseless.yes', 'aimless_walking.yes'],
    ['manic.yes', 'self_talk_ceaseless.yes']
  ],
  contraindications: ['治一种「像发狂但其实不是实热」的状态：到处乱走、一个人说个不停，可是不发冷也不发热', '关键在「无寒热」——没有外感发热，说明是血虚生热、热扰心神，不是阳明实热', '生地用量特别大（二斤），配防己、桂枝、防风、甘草，重点在养血清热', '和阳明发狂（大承气汤证）区别：那种有腹满硬痛、大便不通、潮热谵语']
}
