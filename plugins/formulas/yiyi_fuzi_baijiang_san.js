module.exports = {
  name: 'yiyi_fuzi_baijiang_san',
  title: '薏苡附子败酱散',
  kind: 'formula',
  // 金匮要略·疮痈肠痈浸淫病脉证并治第十八：肠痈之为病，其身甲错，腹皮急，按之濡，如肿状，腹无积聚，身无热，脉数，此为肠内有痈脓，薏苡附子败酱散主之。
  needs: [
    ['chang_yong.yes', 'fever.no'],
    ['lower_abdomen_swelling_pain.yes', 'skin_scaly.yes'],
    ['lower_abdomen_swelling_pain.yes', 'abdominal_tension.yes']
  ],
  contraindications: ['治肠痈**脓已成**而正气不足者：腹部按之软（如肿状）、身不发热、肌肤甲错（皮肤粗糙）', '三味：薏苡仁（排脓利湿）、附子（温阳扶正）、败酱草（清热解毒排脓）', '为什么「身无热」反而用这个方：原文说「腹无积聚，身无热，脉数」——不发热说明已经不是急性实热期，而是脓成日久、正气偏虚，所以要**温阳与排脓并用**', '服法「杵为末，取方寸匕，以水二升，煎减半，顿服，小便当下」', '⚠ 急性阑尾炎不能只靠这首方，必须急诊评估']
}
