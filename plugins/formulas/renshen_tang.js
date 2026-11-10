module.exports = {
  name: 'renshen_tang',
  title: '人参汤',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：胸痹心中痞气，气结在胸，胸满，胁下逆抢心……人参汤亦主之。
  needs: [
    ['chest_stuffy.yes', 'low_energy.yes'],
    ['chest_stuffy.yes', 'cold_extremities.yes']
  ],
  contraindications: ['同一条文里和枳实薤白桂枝汤并列，走的是「虚证」路线：胸阳不振、中焦虚寒', '组成就是理中丸（人参、干姜、白术、甘草）——温补中阳，阳气足了胸阳才能振', '和枳实薤白桂枝汤的鉴别：实证见气结胀满、脉沉紧有力；虚证见倦怠乏力、四肢凉、脉弱', '胸痹久病多虚，不能一味破气通阳']
}
