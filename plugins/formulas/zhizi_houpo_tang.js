module.exports = {
  name: 'zhizi_houpo_tang',
  title: '栀子厚朴汤',
  kind: 'formula',
  // 第79条: 伤寒下后，心烦腹满，卧起不安者，栀子厚朴汤主之。
  needs: [
    ['vex_insomnia.yes', 'abdominal_fullness.yes', 'cold_aversion.no'],
    ['restless.yes', 'abdominal_fullness.yes', 'cold_aversion.no']
  ],
  contraindications: ['下后心烦腹满、卧起不安', '清热除烦、行气除满', '得吐者止后服']
}
