module.exports = {
  name: 'maimendong_tang',
  title: '麦门冬汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：大逆上气，咽喉不利，止逆下气者，麦门冬汤主之。
  needs: [
    ['qi_upward_cough.yes', 'throat_dry.yes'],
    ['qi_upward_cough.yes', 'cough.yes', 'throat_dry.yes']
  ],
  contraindications: ['治「大逆上气、咽喉不利」——气往上冲得厉害，同时嗓子干涩不舒服', '病机是肺胃阴伤、虚火上逆，所以用麦门冬（用量极大，七升）滋养肺胃', '配半夏化痰降逆、人参甘草粳米大枣补中，是「补中有降」', '和射干麻黄汤区别：那条是寒痰实邪（喉中水鸡声），本方是阴虚（咽喉干涩）']
}
