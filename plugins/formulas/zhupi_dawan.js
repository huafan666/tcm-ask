module.exports = {
  name: 'zhupi_dawan',
  title: '竹皮大丸',
  kind: 'formula',
  // 金匮要略·妇人产后病脉证治第二十一：妇人乳中虚，烦乱呕逆，安中益气，竹皮大丸主之。
  needs: [
    ['postpartum.yes', 'restless.yes', 'vomiting.yes'],
    ['postpartum.yes', 'restless.yes', 'low_energy.yes']
  ],
  contraindications: ['治「乳中虚」——**哺乳期**气血亏虚，出现心烦意乱、恶心呕吐', '四味：生竹茹、石膏（清热除烦）、桂枝、甘草（温中益气），加白薇', '原文点明治法叫「**安中益气**」——不是单纯止呕，而是补中气、清虚热', '原文还有加减：「有热者，倍白薇；烦喘者，加柏实一分」', '⚠ 哺乳期用药要考虑对婴儿的影响，须医师指导']
}
