module.exports = {
  name: 'chang_yong',
  title: '肠痈',
  kind: 'summary',
  // 
  needs: [
    ['lower_abdomen_swelling_pain.yes', 'urination_difficulty.no'],
    ['lower_abdomen_swelling_pain.yes', 'abdominal_tension.yes'],
    ['lower_abdomen_swelling_pain.yes', 'sweat.yes'],
    ['abdominal_tension.yes', 'skin_scaly.yes'],
    ['lower_abdomen_swelling_pain.yes']
  ],
  contraindications: ['肠痈是肠内生的痈脓，最典型的部位是**右下腹**（现代医学的阑尾炎就在这里）', '两个关键特征：一是「少腹肿痞，按之即痛」，二是「**小便自调**」——小便正常说明问题不在膀胱尿道，而在肠', '胀痛按下去是「濡」的（软），原文说「腹无积聚」——不是硬的肿块，是脓在里面', '辨脓有无（18.2）：**「以手掩肿上，热者为有脓，不热者为无脓」**——用手捂在肿处，觉得热的是已经化脓，不热的是还没化脓', '分期用药：脓未成可用下法（大黄牡丹汤）；脓已成则不可再峻下（薏苡附子败酱散）', '⚠ 转移性右下腹痛、压痛反跳痛，要立刻急诊排查急性阑尾炎，不能只靠中药观察', '⚠ 本节点刻意不含「发热/不发热」——因为引擎语义是「任一路径被否定则整节点判 no」，若此处要求发热，病人一说「不发烧」整个肠痈就被判无。发热与否交给两个方剂各自区分']
}
