module.exports = {
  name: 'baihe_bing',
  title: '百合病',
  kind: 'summary',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病者，百脉一宗……意欲食复不能食，常默默，欲卧不能卧，欲行不能行，如寒无寒，如热无热，口苦，小便赤。
  needs: [
    ['appetite_fluctuating.yes', 'listless_mute.yes'],
    ['restless_lying.yes', 'cannot_walk.yes'],
    ['pseudo_cold_heat.yes', 'bitter_taste.yes', 'dark_urine.yes']
  ],
  contraindications: ['百合病是一种"想睡睡不着、想吃吃不下、想走走不动"的虚弱状态，常见于热病之后，心神和身体都失养', '特点是浑身不对劲，但查不出明显毛病（原文叫「身形如和」）', '治疗不能用发汗、泻下、催吐。用了这三种治法会让病情加重（原文：得药则剧吐利）', '主方是百合地黄汤；被汗、下、吐折腾过的，改用对应的方（百合知母汤、滑石代赭汤、百合鸡子汤）']
}
