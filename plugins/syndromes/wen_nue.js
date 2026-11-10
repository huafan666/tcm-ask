module.exports = {
  name: 'wen_nue',
  title: '温疟',
  kind: 'summary',
  // 金匮要略·疟病脉证并治第四：温疟者，其脉如平，身无寒但热，骨节疼烦，时呕，白虎加桂枝汤主之。
  needs: [
    ['heat_only_no_chill.yes', 'joint_pain_rigid.yes'],
    ['heat_only_no_chill.yes', 'vomiting.yes', 'joint_pain_rigid.yes']
  ],
  contraindications: ['温疟是「身无寒但热」——只发热不发冷，同时骨节疼、烦得厉害，时不时还想呕', '和瘅疟的区别：温疟还带着骨节疼烦（邪在表、没完全入里）；瘅疟是纯粹的里热伤阴', '脉象原文说「其脉如平」（看不出明显异常），所以脉不是鉴别点']
}
