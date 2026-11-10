module.exports = {
  name: 'chaihu_guizhi_tang',
  title: '柴胡桂枝汤',
  kind: 'formula',
  // 第146条: 伤寒六七日发热微恶寒支节烦疼微呕心下支结外证未去者，柴胡桂枝汤主之。
  // 少阳+太阳表证: 发热微恶寒+支节烦疼+微呕+心下支结。
  needs: [
    // 原文抓手是「支节烦疼」+「发热微恶寒」——是关节疼，不是随便哪儿疼。
    // 原来有一条 ['low_appetite.yes','body_pain.yes']：只要食欲差 + 身上疼就成立，
    // 于是麻黄汤证（一身尽疼 + 没胃口）会被判成柴胡桂枝汤。删掉。
    ['fever.yes', 'mild_cold.yes', 'joint_pain_rigid.yes'],
    ['alternating_cold_heat.yes', 'joint_pain_rigid.yes'],
    ['alternating_cold_heat.yes', 'body_pain.yes']
  ],
  contraindications: ['少阳太阳表证兼见', '和解兼解表(柴胡+桂枝)', '支节烦疼、微呕、心下支结', '单纯身痛无少阳证者不用']
}
