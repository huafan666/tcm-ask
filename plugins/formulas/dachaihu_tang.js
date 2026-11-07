module.exports = {
  name: 'dachaihu_tang',
  title: '大柴胡汤',
  kind: 'formula',
  // 第103条: 柴胡证仍在，呕不止，心下急，郁郁微烦者为未解，与大柴胡汤下之。
  // 少阳兼里实: 呕不止+心下急(心下满痛)。核心=呕+心下急。
  needs: [
    ['vomiting.yes', 'epigastric_fullness.yes'],
    ['low_appetite.yes', 'epigastric_fullness.yes', 'restless.yes']
  ],
  contraindications: ['少阳兼里实(呕不止心下急)', '和解兼泄里实', '心下急为里实之征']
}
