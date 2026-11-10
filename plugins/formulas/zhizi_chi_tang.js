module.exports = {
  name: 'zhizi_chi_tang',
  title: '栀子豉汤',
  kind: 'formula',
  // 第76条: 发汗吐下后虚烦不得眠，若剧者必反复颠倒心中懊恼，栀子豉汤主之。
  // 第77条: 烦热胸中窒；第78条: 身热不去心中结痛。虚烦+热扰胸膈。
  needs: [
    ['vex_insomnia.yes', 'cold_aversion.no', 'epigastric_fullness.no', 'press_only_pain.no'],
    ['chest_stuffy.yes', 'cold_aversion.no'],
    ['heart_bind_pain.yes', 'cold_aversion.no']
  ],
  contraindications: ['虚烦不得眠、心中懊恼', '胸中窒、心中结痛', '热扰胸膈(非实热)', '旧微溏者不可与之']
}
