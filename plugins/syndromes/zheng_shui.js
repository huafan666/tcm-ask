module.exports = {
  name: 'zheng_shui',
  title: '正水',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：正水其脉沉迟，外证自喘……属少阴（肾）。
  needs: [
    ['pitting_edema.yes', 'orthopnea.yes'],
    ['pitting_edema.yes', 'short_breath.yes'],
    ['pitting_edema.yes', 'polyuria.no']
  ],
  contraindications: ['五水之一。正水是肾阳虚、不能化气行水，水湿泛滥全身', '原文定义：**脉沉迟**、**外证自喘**——「自喘」说明水气已经上凌于肺，是本证的重点', '病位在少阴（肾），本质是阳虚，不是单纯水多', '和风水、皮水的区别：风水皮水病位在表，脉浮；正水病位在里（肾），脉沉', '⚠ 全身水肿 + 喘 + 尿少的组合，要查心功能和肾功能']
}
