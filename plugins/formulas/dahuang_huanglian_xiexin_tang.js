module.exports = {
  name: 'dahuang_huanglian_xiexin_tang',
  title: '大黄黄连泻心汤',
  kind: 'formula',
  // 第154条: 心下痞，按之濡，其脉关上浮者，大黄黄连泻心汤主之。
  // 心下痞按之濡(热痞)。核心=心下痞按之濡。
  needs: [
    ['epigastric_lump_soft.yes', 'cold_aversion.no']
  ],
  contraindications: ['心下痞按之濡(热痞)', '泄热消痞', '热痞轻证']
}
