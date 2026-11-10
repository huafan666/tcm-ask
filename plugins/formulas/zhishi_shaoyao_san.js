module.exports = {
  name: 'zhishi_shaoyao_san',
  title: '枳实芍药散',
  kind: 'formula',
  // 金匮要略·妇人产后病脉证治第二十一：产后腹痛，烦满不得卧，枳实芍药散主之。
  needs: [
    ['postpartum.yes', 'abdominal_pain.yes', 'restless.yes'],
    ['postpartum.yes', 'abdominal_pain.yes', 'chest_qi_stuffiness.yes'],
    ['postpartum.yes', 'abdominal_tension.yes']
  ],
  contraindications: ['治产后腹痛而**烦满不得卧**——肚子痛、心里烦、胀得躺不住，偏气滞', '只有两味：枳实（破气散结）、芍药（和血缓急），等分为散', '原文用法：「服方寸匕，日三服，并主痈脓，以麦粥下之」——用麦粥送服，护胃', '和当归生姜羊肉汤的区别：本方偏**气滞实痛**；当归生姜羊肉汤偏**虚寒隐痛**', '若服后不愈，说明不是单纯气滞，而是「腹中有瘀血著脐下」，要改用下瘀血汤']
}
