module.exports = {
  name: 'mufangji_qu_shigao_jia_fuling_mangxiao_tang',
  title: '木防己汤去石膏加茯苓芒硝汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：虚者即愈，实者三日复发，后与不愈者，宜木防己汤去石膏加茯苓芒硝汤主之。
  needs: [
    ['mufangji_tang.yes', 'constipation.yes'],
    ['epigastric_pressing_pain.yes', 'face_black.yes', 'constipation.yes']
  ],
  contraindications: ['治木防己汤证「实者三日复发」的情况——补正后短期好转又复发，说明实结顽固', '去掉石膏（无热象了），加茯苓、芒硝：茯苓利水，芒硝软坚散结、通下', '从「清热」转向「软坚逐水」，针对心下痞坚这个硬结', '芒硝须冲服（烊化），不宜久煎']
}
