module.exports = {
  name: 'maxing_shigan_tang',
  title: '麻黄杏仁甘草石膏汤(麻杏石甘汤)',
  kind: 'formula',
  // 第63条: 发汗后不可更行桂枝汤，汗出而喘无大热者可与之。
  // 热邪壅肺: 汗出+喘，但无大热。核心=汗出+喘。
  needs: [
    ['sweat.yes', 'chuan.yes', 'cold_aversion.no']
  ],
  contraindications: ['发汗后汗出而喘(热壅肺)', '无大热(非阳明)，不可误作白虎', '发汗后不可再行桂枝汤']
}

