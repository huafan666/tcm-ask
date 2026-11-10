module.exports = {
  name: 'shi_bi',
  title: '湿痹',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，关节疼痛而烦，脉沉而细者，此名湿痹。湿痹之候，小便不利，大便反快，但当利其小便。
  needs: [
    ['joint_pain_rigid.yes', 'urination_difficulty.yes'],
    ['joint_pain_rigid.yes', 'urination_difficulty.yes', 'diarrhea.yes']
  ],
  contraindications: ['湿痹：关节疼痛而烦（湿着关节、阳气不通）', '小便不利是关键——湿无出路，故治则「但当利其小便」', '大便反快（便溏而快）是湿胜的另一面，非脾虚下利', '本条未出方：治则在利小便（五苓散类），不出具体方']
}
