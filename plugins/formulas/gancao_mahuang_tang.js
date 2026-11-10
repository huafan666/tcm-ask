module.exports = {
  name: 'gancao_mahuang_tang',
  title: '甘草麻黄汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：里水，越婢加术汤主之；甘草麻黄汤亦主之。
  needs: [
    ['pitting_edema.yes', 'no_sweat.yes'],
    ['pitting_edema.yes', 'no_sweat.yes', 'fever.no']
  ],
  contraindications: ['治里水而无汗者，是发汗的极简方', '只有两味：甘草、麻黄。麻黄发汗宣肺利水，甘草和中', '「里水」在《金匮》里也叫「皮水」，指水在皮肤肌腠之间', '和越婢加术汤的区别：本方纯属表实无汗，没有热象（无石膏）；有热象用越婢加术汤', '原文服法「温服一升，重复汗出，不汗再服，慎风寒」——以出汗为度，注意避风']
}
