module.exports = {
  name: 'e_lu_bu_jin',
  title: '恶露不尽',
  kind: 'summary',
  // 金匮要略·妇人产后病脉证治第二十一：产后七八日，无太阳证，少腹坚痛，此恶露不尽；不大便，烦躁发热……宜大承气汤主之。热在里，结在膀胱也。
  needs: [
    ['postpartum.yes', 'lochia_retention.yes'],
    ['lochia_retention.yes', 'lower_abdomen_cramp.yes'],
    ['postpartum.yes', 'lower_abdomen_cramp.yes', 'fixed_mass.yes']
  ],
  contraindications: ['恶露不尽指产后瘀血排不干净，表现为**少腹坚硬疼痛、恶露淋漓不断**', '原文还提示：若同时不大便、烦躁发热、傍晚加重、吃不下、吃了说胡话，那是「热在里，结在膀胱」，属实热结滞，可用大承气汤攻下', '若只是腹痛、恶露不尽而无实热，则用下瘀血汤化瘀（腹中有瘀血著脐下）', '⚠ 产后出血/恶露异常要警惕**胎盘残留、子宫复旧不全、感染**，须做超声检查']
}
