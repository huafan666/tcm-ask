module.exports = {
  name: 'ji_ju',
  title: '积聚',
  kind: 'summary',
  // 金匮要略·五脏风寒积聚病脉证并治第十一：积者，脏病也，终不移；聚者，腑病也，发作有时，展转痛移，为可治。
  needs: [
    ['fixed_mass.yes'],
    ['fixed_mass.yes', 'abdominal_pain.yes'],
    ['migratory_pain.yes', 'abdominal_pain.yes'],
    ['migratory_pain.yes']
  ],
  contraindications: ['积和聚的根本区别就八个字：**积者终不移，聚者展转痛移**', '「积」属脏病，包块固定在一处不动，病程长、较难治，多属瘀血痰浊凝结', '「聚」属腑病，时发时止、痛点会游走，原文说「为可治」，多属气机聚散', '原文另提「谷气」：胁下痛、按之则愈、但会复发，是饮食积滞所致', '⚠ 固定包块要警惕肿瘤等器质性疾病，务必做影像检查，不能只靠中药']
}
