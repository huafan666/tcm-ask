module.exports = {
  name: 'gancao_xiexin_tang',
  title: '甘草泻心汤',
  kind: 'formula',
  // 第158条: 伤寒中风医反下之人下利日数十行谷不化腹中雷鸣，心下痞硬而满干呕心烦，甘草泻心汤主之。
  // 心下痞硬满+下利谷不化+干呕心烦。
  needs: [
    ['epigastric_lump_soft.yes', 'clear_grain_diarrhea.yes'],
    ['epigastric_lump_soft.yes', 'vomiting.yes', 'restless.yes'],
    // 金匮 3.10：狐惑病蚀于上部则声喝，甘草泻心汤主之
    ['hu_huo_bing.yes', 'voice_hoarse.yes']
  ],
  contraindications: ['心下痞硬满', '下利谷不化、腹中雷鸣', '干呕心烦', '补虚消痞止利', '狐惑病蚀于喉、声音嘶哑']
}
