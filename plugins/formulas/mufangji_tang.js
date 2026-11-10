module.exports = {
  name: 'mufangji_tang',
  title: '木防己汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：膈间支饮，其人喘满，心下痞坚，面色黧黑，其脉沉紧，得之数十日，医吐下之不愈，木防己汤主之。
  needs: [
    ['orthopnea.yes', 'epigastric_pressing_pain.yes', 'face_black.yes'],
    ['chest_qi_stuffiness.yes', 'epigastric_pressing_pain.yes', 'face_black.yes']
  ],
  contraindications: ['治膈间支饮的重证：喘满、心口下面痞硬坚满、面色黧黑发暗', '「得之数十日，医吐下之不愈」——病程长，用吐法和下法都没效，说明是虚实夹杂', '木防己、桂枝通阳利水，石膏清郁热，人参补正气——攻补兼施', '原文给了预后判断：**虚者即愈，实者三日复发**——如果补正后好转，说明虚为主；如果三天又复发，说明实结未去', '复发后用木防己汤去石膏加茯苓芒硝汤']
}
