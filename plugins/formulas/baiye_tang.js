module.exports = {
  name: 'baiye_tang',
  title: '柏叶汤',
  kind: 'formula',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：吐血不止者，柏叶汤主之。
  needs: [
    ['hematemesis.yes', 'cold_extremities.yes'],
    ['hematemesis.yes', 'low_energy.yes'],
    ['hematemesis.yes', 'poor_complexion.yes']
  ],
  contraindications: ['治「吐血不止」而偏**虚寒**者：血色淡、人疲乏、四肢不温', '三味：柏叶（凉血止血）、干姜（温中）、艾（温经止血），加马通汁（马粪绞汁）', '寒热并用：柏叶凉血、干姜艾叶温中——因为虚寒性出血不能一味凉止血，也不能一味温', '原文用法「以水五升，取马通汁一升，合煮取一升，分温再服」', '⚠ 吐血不止属急症，必须先排查消化道大出血、支气管扩张咯血等，及时急诊']
}
