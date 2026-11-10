module.exports = {
  name: 'baitouweng_jia_gancao_ajiao_tang',
  title: '白头翁加甘草阿胶汤',
  kind: 'formula',
  // 金匮要略·妇人产后病脉证治第二十一：产后下利虚极，白头翁加甘草阿胶汤主之。
  needs: [
    ['postpartum.yes', 'diarrhea.yes', 'low_energy.yes'],
    ['postpartum.yes', 'diarrhea.yes', 'poor_complexion.yes'],
    ['postpartum.yes', 'diarrhea.yes', 'tenesmus.yes']
  ],
  contraindications: ['治「产后下利虚极」——产后本就气血大亏，又拉肚子，虚上加虚', '就是白头翁汤（白头翁、黄连、黄柏、秦皮）**加甘草、阿胶**：白头翁汤清热燥湿止痢，甘草缓中，阿胶养血滋阴', '为什么加这两味：产后「虚极」，单纯用苦寒的清热药会再伤正气，所以一边清一边补', '和白头翁汤的区别：白头翁汤治热利下重（实证），本方**兼虚**', '⚠ 产后腹泻伴发热、腹痛剧烈要排除产褥感染与肠道感染']
}
