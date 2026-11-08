module.exports = {
  name: 'rou_jing',
  title: '柔痉',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，发热汗出，而不恶寒，名曰柔痉。
  needs: ['fever.yes', 'sweat.yes', 'cold_aversion.no'],
  contraindications: ['太阳病发热汗出而不恶寒者，名曰柔痉', '主方栝蒌桂枝汤（桂枝汤加栝蒌根），本条方剂待批 2 落库', '痉病误汗则表益虚']
}
