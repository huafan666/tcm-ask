module.exports = {
  name: 'xiaoqinglong_jia_shigao_tang',
  title: '小青龙加石膏汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：肺胀，咳而上气，烦躁而喘，脉浮者，心下有水，小青龙加石膏汤主之。
  needs: [
    ['qi_upward_cough.yes', 'restless.yes'],
    ['qi_upward_cough.yes', 'restless.yes', 'throat_rales.yes']
  ],
  contraindications: ['治肺胀而「烦躁」——本来是寒饮（小青龙证），郁久了化出热来，所以烦躁', '小青龙汤（麻黄、桂枝、细辛、干姜、半夏、五味子、芍药、甘草）温化寒饮 + 石膏清郁热', '「烦躁」是加石膏的指征，没有烦躁就单纯用小青龙汤', '和越婢加半夏汤区别：本条以寒饮为主兼郁热（有烦躁），越婢加半夏偏饮热壅盛（目如脱状）']
}
