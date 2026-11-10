module.exports = {
  name: 'zhizi_gancao_chi_tang',
  title: '栀子甘草豉汤',
  kind: 'formula',
  // 76条：发汗吐下后，虚烦不得眠，若剧者，必反复颠倒，心中懊憹，栀子豉汤主之；若少气者，栀子甘草豉汤主之；若呕者，栀子生姜豉汤主之。
  needs: ['vex_insomnia.yes', 'short_breath.yes', 'cold_aversion.no'],
  contraindications: ['76条：栀子豉汤证兼「少气」者——虚烦不得眠 + 短气不足以息', '栀子豉汤加甘草，补中气而缓急', '与栀子豉汤的区别只在少气；与栀子生姜豉汤的区别在有呕无呕']
}
