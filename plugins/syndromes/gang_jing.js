module.exports = {
  name: 'gang_jing',
  title: '刚痉',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，发热无汗，反恶寒者，名曰刚痉。
  needs: ['fever.yes', 'no_sweat.yes', 'cold_aversion.yes'],
  contraindications: ['太阳病发热无汗反恶寒者，名曰刚痉', '与柔痉只差有汗无汗与恶寒与否：有汗不恶寒者为柔痉', '痉病误汗则表益虚（身热足寒、口噤、背反张者尤忌发汗）']
}
