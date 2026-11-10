module.exports = {
  name: 'nue_mu',
  title: '疟母',
  kind: 'summary',
  // 金匮要略·疟病脉证并治第四：病疟以月，一日发……设不差，当月尽解；如其不差……此结为症瘕，名曰疟母，急治之，宜鳖甲煎丸。
  needs: ['periodic_chill_fever.yes', 'hypochondriac_mass.yes'],
  contraindications: ['疟母是疟疾拖久了没好，邪气结成块，堵在胁下——原文说「此结为症瘕，名曰疟母」', '摸得到硬块、按着顶手，是瘀血痰浊互结成的「块」，不是单纯的寒热发作', '原文特意说「急治之」——这种块要尽早化掉，拖久了更难消', '现代可见于疟疾反复发作后的脾肿大']
}
