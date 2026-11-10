module.exports = {
  name: 'yuebi_jia_banxia_tang',
  title: '越婢加半夏汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳而上气，此为肺胀，其人喘，目如脱状，脉浮大者，越婢加半夏汤主之。
  needs: [
    ['qi_upward_cough.yes', 'eye_bulging.yes'],
    ['eye_bulging.yes', 'orthopnea.yes']
  ],
  contraindications: ['治肺胀重证：咳喘气逆、喘得眼睛往外鼓像要脱出', '越婢汤（麻黄、石膏、生姜、大枣、甘草）宣肺泄热 + 半夏降逆化痰', '属饮热壅肺、偏热的肺胀；脉浮大说明邪仍在表，脉象按口径不入条件', '和越婢汤本证区别：本方多有咳喘、目如脱状的闷胀感']
}
