module.exports = {
  name: 'tuguagen_san',
  title: '土瓜根散',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：带下经水不利，少腹满痛，经一月再见者，土瓜根散主之。
  needs: [
    ['abdominal_fullness.yes', 'lower_abdomen_cramp.yes', 'vaginal_bleeding.yes'],
    ['vaginal_bleeding.yes', 'fixed_mass.yes'],
    ['lower_abdomen_cramp.yes', 'abdominal_pain.yes', 'vaginal_discharge.yes']
  ],
  contraindications: ['治瘀血导致的月经不调：**经水不利、少腹满痛、一个月来两次月经**', '四味：土瓜根、芍药、桂枝、䗪虫——活血化瘀通经', '「经一月再见者」是瘀血阻滞、血不循经的表现，瘀去则经自调', '⚠ 月经频发、异常出血要排除子宫内膜病变、子宫肌瘤、内分泌问题']
}
