module.exports = {
  name: 'chaihu_guizhi_tang',
  title: '柴胡桂枝汤',
  kind: 'formula',
  // 第146条: 伤寒六七日发热微恶寒支节烦疼微呕心下支结外证未去者，柴胡桂枝汤主之。
  // 少阳+太阳表证: 发热微恶寒+支节烦疼+微呕+心下支结。
  needs: [
    ['alternating_cold_heat.yes', 'body_pain.yes'],
    ['low_appetite.yes', 'body_pain.yes']
  ],
  contraindications: ['少阳太阳表证兼见', '和解兼解表(柴胡+桂枝)', '支节烦疼、微呕']
}
