module.exports = {
  name: 'pi_shui',
  title: '皮水',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：皮水其脉亦浮，外证胕肿，按之没指，不恶风，其腹如鼓，不渴，当发其汗。
  needs: [
    ['pitting_edema.yes', 'wind_aversion.no'],
    ['pitting_edema.yes', 'thirsty.no'],
    ['pitting_edema.yes', 'abdominal_fullness.yes']
  ],
  contraindications: ['五水之一。皮水是水湿停在皮肤肌腠之间', '原文定义：脉浮、**胕肿按之没指**（按下去一个坑）、**不恶风**、腹如鼓、**不渴**', '与风水的关键区别就在「不恶风」——皮水没有外感表证，是纯粹的水湿', '治法同样是「当发其汗」', '「不渴」也是鉴别点：口渴说明津液已伤，就不宜单纯发汗']
}
