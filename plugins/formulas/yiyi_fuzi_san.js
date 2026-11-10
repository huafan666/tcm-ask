module.exports = {
  name: 'yiyi_fuzi_san',
  title: '薏苡附子散',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：胸痹缓急者，薏苡附子散主之。
  needs: [
    ['chest_back_pain.yes', 'cold_aversion.yes'],
    ['chest_back_pain.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治「胸痹缓急」——疼痛时轻时重、时缓时急，发作有间歇', '只有薏苡仁 + 附子两味，附子温阳散寒、薏苡仁除湿宣痹', '偏寒湿痹阻的胸痹，适合阴雨天加重、遇冷发作的类型', '附子有毒须炮制久煎']
}
