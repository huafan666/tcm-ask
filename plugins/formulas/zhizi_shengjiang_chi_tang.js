module.exports = {
  name: 'zhizi_shengjiang_chi_tang',
  title: '栀子生姜豉汤',
  kind: 'formula',
  // 76条：……若呕者，栀子生姜豉汤主之。
  needs: ['vex_insomnia.yes', 'vomiting.yes', 'cold_aversion.no'],
  contraindications: ['76条：栀子豉汤证兼「呕」者——虚烦不得眠 + 呕吐', '栀子豉汤加生姜，降逆止呕', '与栀子甘草豉汤的区别：彼为少气，此为呕']
}
