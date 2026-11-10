module.exports = {
  name: 'zhuan_jin',
  title: '转筋',
  kind: 'summary',
  // 金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九：转筋之为病，其人臂脚直……转筋入腹者，鸡屎白散主之。
  needs: [
    ['limb_straight_spasm.yes'],
    ['limb_straight_spasm.yes', 'cold_extremities.yes'],
    ['limb_straight_spasm.yes', 'muscle_twitching.yes']
  ],
  contraindications: ['转筋就是**肌肉突然痉挛、绷直抽住**，最常见于小腿（俗称抽筋）', '原文描述「其人臂脚直」——胳膊或腿绷直了伸不开', '「转筋入腹者」是重症：痉挛从四肢蔓延到腹部，腹部抽紧，要用鸡屎白散', '常见诱因：受寒、大汗后津液不足、霍乱吐泻脱水、缺钙', '⚠ 频繁抽筋要查电解质（钙、镁、钾）与是否有脱水、甲状腺等问题']
}
