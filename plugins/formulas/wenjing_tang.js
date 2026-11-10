module.exports = {
  name: 'wenjing_tang',
  title: '温经汤',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人年五十所，病下利数十日不止，暮即发热，少腹里急，腹满，手掌烦热，唇口干燥……曾经半产，瘀血在少腹不去。
  needs: [
    ['hand_foot_hot.yes', 'throat_dry.yes', 'lower_abdomen_cramp.yes'],
    ['hand_foot_hot.yes', 'abdominal_fullness.yes', 'vaginal_bleeding.yes'],
    ['lower_abdomen_cramp.yes', 'vaginal_bleeding.yes', 'weight_loss.yes']
  ],
  contraindications: ['治「妇人年五十所」——**更年期前后的复杂症候**：傍晚发热、小腹拘急、腹满、手掌烦热、唇口干燥', '原文点明病根：「曾经半产，**瘀血在少腹不去**」——小产或流产留下瘀血，日久化热伤阴', '十二味：吴茱萸、桂枝、生姜温经；当归、川芎、芍药、阿胶、麦冬、丹皮养血滋阴清热；人参、甘草补气——**温经散寒与养血滋阴并用**', '这是妇科调经的千古名方，凡「寒热错杂、虚实夹杂」的月经病、更年期综合征都可考虑', '⚠ 原文「病下利数十日不止」的「下利」，多数注家认为指**下血（阴道出血）**而非腹泻，联系上下文更通']
}
