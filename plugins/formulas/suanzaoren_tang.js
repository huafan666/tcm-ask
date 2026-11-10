module.exports = {
  name: 'suanzaoren_tang',
  title: '酸枣仁汤',
  kind: 'formula',
  // 金匮要略·血痹虚劳病脉证并治第六：虚劳虚烦不得眠，酸枣仁汤主之。
  needs: [
    ['vex_insomnia.yes', 'throat_dry.yes'],
    ['vex_insomnia.yes', 'heart_palp.yes'],
    ['vex_insomnia.yes']
  ],
  contraindications: ['治虚劳引起的失眠：心里烦躁、躺不住、睡不着', '酸枣仁养肝血安神为君，知母清热除烦，茯苓宁心，川芎调血，甘草调和', '重点在「虚」——是肝血不足、虚热内扰，不是实火', '和栀子豉汤（心中懊恼、反复颠倒）区别：那条是热郁胸膈，多有身热、舌苔黄']
}
