module.exports = {
  name: 'guizhi_qu_shaoyao_jia_maxin_fuzi_tang',
  title: '桂枝去芍药加麻辛附子汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：气分，心下坚，大如盘，边如旋杯，水饮所作，桂枝去芍药加麻辛附子汤主之。
  needs: [
    ['epigastric_mass_plate.yes', 'cold_extremities.yes'],
    ['epigastric_mass_plate.yes', 'pitting_edema.yes']
  ],
  contraindications: ['治气分而偏**阳虚寒凝**者：心口下盘大硬结，伴四肢发凉', '桂枝汤去芍药 + 麻黄、细辛、附子——温阳散寒、通阳化气', '为什么去芍药：芍药酸收敛阴，会妨碍通阳散寒，所以去掉', '和枳术汤是一虚一实：本方偏阳虚寒凝（虚），枳术汤偏气滞水停（实）', '附子有毒须炮制久煎']
}
