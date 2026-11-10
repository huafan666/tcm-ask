module.exports = {
  name: 'xiexin_tang',
  title: '泻心汤（三黄泻心汤）',
  kind: 'formula',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：心气不足，吐血、衄血，泻心汤主之。泻心汤：大黄二两，黄连、黄芩各一两。
  needs: [
    ['hematemesis.yes', 'restless.yes'],
    ['epistaxis.yes', 'restless.yes'],
    ['hematemesis.yes', 'face_red_patches.yes'],
    ['epistaxis.yes', 'constipation.yes']
  ],
  contraindications: ['治心火亢盛、迫血妄行的吐血、衄血', '三味：大黄、黄连、黄芩——即「三黄泻心汤」，苦寒直折火热，火降则血自止', '原文的治法叫「**泻心**」，是泻心火而不是补心；这里「心气不足」古义有争议，多数注家认为是「心气不定」（心神不安），不是心气虚', '服法：「以水三升，煮取一升，顿服之」——一次服完，取速效', '⚠ 只适合实热出血；虚寒性出血（面白、肢冷、脉弱）忌用，用了会更糟。出血量大时必须立即急诊']
}
