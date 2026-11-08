module.exports = {
  name: 'gang_jing',
  title: '刚痉',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，发热无汗，反恶寒者，名曰刚痉。
  needs: ['fever.yes', 'no_sweat.yes', 'cold_aversion.yes', 'neck_stiff_pain.yes'],
  contraindications: ['太阳病发热无汗反恶寒，名曰刚痉（金匮2.1）', '痉病必有筋脉拘急（项背强急、身体强几几），故要求 neck_stiff_pain——否则普通风寒表实证会被误判', '与柔痉鉴别：无汗恶寒者为刚痉，汗出而不恶寒者为柔痉', '痉病误汗则表益虚、恶寒更甚', '欲作刚痉（无汗+口噤不得语+气上冲胸）主葛根汤']
}
