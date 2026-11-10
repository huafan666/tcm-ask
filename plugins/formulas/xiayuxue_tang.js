module.exports = {
  name: 'xiayuxue_tang',
  title: '下瘀血汤',
  kind: 'formula',
  // 金匮要略·妇人产后病脉证治第二十一：产妇腹痛，法当以枳实芍药散，假令不愈者，此为腹中有瘀血著脐下，宜下瘀血汤主之；亦主经水不利。
  needs: [
    ['postpartum.yes', 'fixed_mass.yes', 'abdominal_pain.yes'],
    ['e_lu_bu_jin.yes', 'fixed_mass.yes'],
    ['postpartum.yes', 'abdominal_pain.yes', 'constipation.yes']
  ],
  contraindications: ['治产后瘀血结在脐下：腹痛、有固定包块、枳实芍药散治不好的那种', '三味：大黄、桃仁、䗪虫（土元），「炼蜜和为四丸，以酒一升，煎一丸，取八合顿服之」', '原文说「**新血下如豚肝**」——服药后排出像猪肝样的瘀血块，是瘀血排出的表现', '本方也治「经水不利」（月经不通）', '⚠ **破血力峻，产后体虚者慎用**；出血多、有感染、剖宫产伤口未愈者忌用；孕妇绝对禁用']
}
