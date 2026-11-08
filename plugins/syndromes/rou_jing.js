module.exports = {
  name: 'rou_jing',
  title: '柔痉',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，发热汗出，而不恶寒，名曰柔痉。
  needs: ['fever.yes', 'sweat.yes', 'neck_stiff_pain.yes'],
  contraindications: ['太阳病发热汗出，而不恶寒，名曰柔痉（金匮2.2）', '与刚痉鉴别：有汗无汗——无汗反恶寒者为刚痉，汗出者为柔痉', '原文作「不恶寒」，临床汗出者多以恶风为主，故不把「恶寒/不恶寒」作硬条件', '痉病误汗则表益虚，恶寒更甚', '主方栝蒌桂枝汤']
}
