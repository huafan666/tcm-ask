module.exports = {
  name: 'guizhi_qu_shaoyao',
  title: '桂枝去芍药汤',
  kind: 'formula',
  // 第21条: 太阳病下之后脉促胸满者，桂枝去芍药汤主之。
  // 第22条紧接一句「若微寒者，桂枝去芍药加附子汤主之」——
  // 所以本条是「胸满而**没有**微寒」那一半，见微寒就该走加附子汤。
  // 原来有一条 ['chest_fullness.yes','cold_aversion.yes']，会把该用加附子的病人
  // 一起算进本方，等于把 21/22 两条的鉴别抹掉了。
  needs: [
    ['chest_fullness.yes', 'mild_cold.no'],
    ['chest_fullness.yes', 'wind_aversion.yes']
  ],
  contraindications: ['下之后脉促胸满者主之', '去芍药因胸满忌酸敛', '须表未解(兼见恶风)', '若兼微寒者，属桂枝去芍药加附子汤，非本方']
}

