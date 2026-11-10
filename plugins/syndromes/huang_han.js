module.exports = {
  name: 'huang_han',
  title: '黄汗',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：黄汗之为病，身体肿，发热汗出而渴，状如风水，汗沾衣，色正黄如柏汁……以汗出入水中浴，水从汗孔入得之。
  needs: [
    ['yellow_sweat.yes', 'pitting_edema.yes'],
    ['yellow_sweat.yes', 'body_heavy.yes'],
    ['yellow_sweat.yes', 'waist_split_sweat.yes'],
    ['yellow_sweat.yes', 'lower_leg_cold.yes']
  ],
  contraindications: ['五水之一（也算独立一病）。特征是**汗出色黄如柏汁**，把内衣染黄，同时身体浮肿', '原文的病因说得很具体：「以汗出入水中浴，水从汗孔入得之」——出汗时下水、水从汗孔侵入', '还常伴两胫自冷、腰以上出汗而下无汗、身体疼重、烦躁', '与黄疸的区别：黄汗是**汗黄**，黄疸是**身目尿黄**（皮肤眼睛发黄）', '⚠ 汗色发黄要先排除肝胆疾病引起的黄疸，也要注意是否与饮食、药物、汗液成分有关']
}
