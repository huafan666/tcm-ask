module.exports = {
  name: 'shi_shui',
  title: '石水',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：石水其脉自沉，外证腹满不喘。
  needs: [
    ['abdominal_fullness.yes', 'pitting_edema.yes', 'short_breath.no'],
    ['abdominal_fullness.yes', 'pitting_edema.yes', 'urination_difficulty.yes']
  ],
  contraindications: ['五水之一。石水是水气结在下焦，坚硬如石，所以叫「石水」', '原文定义：脉沉、**腹满**、**不喘**', '与正水的关键区别就在「不喘」——正水水气上凌于肺所以喘，石水结在下焦所以不喘', '病位偏下焦肝肾，以腹部胀满为主', '⚠ 腹水明显、腹壁静脉曲张的，要警惕肝硬化腹水等，须做影像和肝功能检查']
}
