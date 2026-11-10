module.exports = {
  name: 'jin_yin_chuang',
  title: '浸淫疮',
  kind: 'summary',
  // 金匮要略·疮痈肠痈浸淫病脉证并治第十八：浸淫疮，从口流向四肢者，可治；从四肢流来入口者，不可治。浸淫疮，黄连粉主之。
  needs: [
    ['spreading_skin_sore.yes'],
    ['spreading_skin_sore.yes', 'skin_itch_hives.yes'],
    ['spreading_skin_sore.yes', 'oozing_skin.yes']
  ],
  contraindications: ['浸淫疮是**不断向周围蔓延**的皮肤疮疡，「浸淫」就是像水浸润一样越扩越大', '原文用走向判断预后：「从口流向四肢者，可治；从四肢流来入口者，不可治」——**从躯干往四肢蔓延的好治，从四肢往躯干（尤其向口）蔓延的难治**。这是古人观察疾病向心性扩散的经验', '治疗用黄连粉外敷，黄连苦寒清热燥湿', '对应现代的湿疹、脓疱疮、接触性皮炎一类渗出性皮肤病', '⚠ 大面积渗出、发热、红肿扩散的要及时就医，警惕皮肤感染扩散']
}
