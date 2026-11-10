module.exports = {
  name: 'qi_fen',
  title: '气分',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：气分，心下坚，大如盘，边如旋杯，水饮所作，桂枝去芍药加麻辛附子汤主之。心下坚，大如盘，边如旋盘，水饮所作，枳术汤主之。
  needs: [
    ['epigastric_mass_plate.yes'],
    ['epigastric_mass_plate.yes', 'abdominal_fullness.yes'],
    ['epigastric_mass_plate.yes', 'pitting_edema.yes']
  ],
  contraindications: ['气分是水气与寒气互结在气分，导致阳气不通', '最形象的表现：**心下坚，大如盘，边如旋杯/旋盘**——心口下面有一块硬结，有盘子那么大、边缘像倒扣的杯子', '和积聚的区别：气分以「水气」为本，多伴水肿；用药也是通阳化气利水，不是攻瘀', '两个方一虚一实：桂枝去芍药加麻辛附子汤偏阳虚寒凝，枳术汤偏气滞水停', '原文还说「水饮所作」——明确这是水饮造成的']
}
