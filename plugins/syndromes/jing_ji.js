module.exports = {
  name: 'jing_ji',
  title: '惊悸',
  kind: 'summary',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：寸口脉动而弱，动即为惊，弱则为悸……心下悸者，半夏麻黄丸主之。
  needs: [
    ['heart_palp.yes', 'low_energy.yes'],
    ['heart_palp.yes', 'restless.yes'],
    ['heart_palp.yes']
  ],
  contraindications: ['原文把「惊」和「悸」分开讲：「动即为惊，弱则为悸」——惊是心神不宁、容易受惊；悸是心气不足、心跳不自主', '合起来叫惊悸：心跳不安、容易受惊、心神不宁', '病位在心，多与心气不足、水饮上凌有关', '16.13 的「心下悸」用半夏麻黄丸——那是水饮上凌于心导致的悸']
}
