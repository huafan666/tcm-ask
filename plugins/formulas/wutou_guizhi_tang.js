module.exports = {
  name: 'wutou_guizhi_tang',
  title: '抵当乌头桂枝汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：寒疝腹中痛，逆冷，手足不仁，若身疼痛，灸刺诸药不能治，抵当乌头桂枝汤主之。
  needs: [
    ['abdominal_pain.yes', 'cold_extremities.yes', 'body_pain.yes'],
    ['abdominal_pain.yes', 'limb_numbness.yes']
  ],
  contraindications: ['治寒疝而**表里同病**：腹中痛（里寒）+ 四肢逆冷、手足麻木不仁 + 身体疼痛（表寒）', '「灸刺诸药不能治」——说明病情顽固，一般方法都试过了', '组成是乌头 + 桂枝汤：乌头温里散寒，桂枝汤调和营卫解表', '**乌头大毒**，须蜜煎；原文服法特意叮嘱「初服二合，不知，即服三合，又不知，复加至五合」——一点点试，「其知者，如醉状，得吐者为中病」——出现像喝醉、想吐的反应说明药已中病，**必须立即停服**', '孕妇绝对忌用']
}
