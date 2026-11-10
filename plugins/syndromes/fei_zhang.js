module.exports = {
  name: 'fei_zhang',
  title: '肺胀',
  kind: 'summary',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：上气喘而躁者，属肺胀……咳而上气，此为肺胀，其人喘，目如脱状……肺胀，咳而上气，烦躁而喘。
  needs: [
    ['qi_upward_cough.yes', 'restless.yes'],
    ['qi_upward_cough.yes', 'eye_bulging.yes'],
    ['qi_upward_cough.yes', 'orthopnea.yes']
  ],
  contraindications: ['肺胀是肺气胀满、不能肃降，表现为咳喘、气往上冲、胸闷胀得厉害', '严重时喘得眼睛往外鼓、像要脱出来（原文：目如脱状），只能坐着不能平躺', '常伴烦躁（原文：喘而躁者），因为气机壅滞、郁而化热', '病机是「心下有水」——水饮内停 + 外邪束表，肺气不得宣降', '和一般咳嗽的区别：肺胀有明显的胸中胀满感和呼吸窘迫']
}
