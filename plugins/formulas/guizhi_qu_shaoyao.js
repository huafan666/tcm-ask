module.exports = {
  name: 'guizhi_qu_shaoyao',
  title: '桂枝去芍药汤',
  kind: 'formula',
  // 第21条: 太阳病下之后脉促胸满者，桂枝去芍药汤主之。
  // 暂不做脉，去脉促，用 胸满 主判；脉促待做脉后加回。
  needs: [
    ['chest_fullness.yes', 'wind_aversion.yes'],
    ['chest_fullness.yes', 'cold_aversion.yes']
  ],
  contraindications: ['下之后脉促胸满者主之', '去芍药因胸满忌酸敛', '须表未解(兼见恶风/恶寒)']
}

