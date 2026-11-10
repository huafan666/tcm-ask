module.exports = {
  name: 'gancao_fenmi_tang',
  title: '甘草粉蜜汤',
  kind: 'formula',
  // 金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九：蚘虫之为病，令人吐涎，心痛，发作有时，毒药不止，甘草粉蜜汤主之。
  needs: [
    ['saliva_heart_pain_paroxysmal.yes'],
    ['hui_chong.yes', 'abdominal_pain.yes'],
    ['round_worm_vomit.yes', 'saliva_spit.yes']
  ],
  contraindications: ['治蛔虫引起的吐涎、心口痛，尤其「**毒药不止**」——用了杀虫猛药也止不住的情况', '三味：甘草、粉（米粉或铅粉，历来有争议）、蜜。「甘以缓之」——用甘甜之味安抚蛔虫、缓急止痛', '「粉」究竟是米粉还是铅粉，注家分歧很大：主张米粉的说甘缓安蛔；主张铅粉的说兼能杀虫。**铅粉有毒，现代绝不可用**', '原文用法「以水三升，先煮甘草，取二升，去滓，内粉蜜，搅令和，煎如薄粥，温服一升，差即止」', '⚠ 蛔虫性肠梗阻、胆道蛔虫属急症，须就医']
}
