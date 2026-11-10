module.exports = {
  name: 'fei_yong',
  title: '肺痈',
  kind: 'summary',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳而胸满，振寒脉数，咽干不渴，时出浊唾腥臭，久久吐脓如米粥者，为肺痈。
  needs: [
    ['cough.yes', 'foul_pus_sputum.yes'],
    ['cough.yes', 'chest_fullness.yes', 'foul_pus_sputum.yes'],
    ['orthopnea.yes', 'foul_pus_sputum.yes']
  ],
  contraindications: ['肺痈是肺里生了痈脓，属热毒壅肺、血败肉腐', '关键特征：咳吐腥臭浊痰，拖久了吐出来像米粥一样的脓', '常伴怕冷打寒战、胸满、咽干但不渴（热在肺不在胃，所以不渴）', '分期：初起（表证期）→ 成痈期 → 溃脓期 → 恢复期，不同阶段用方不同', '和肺痿的区别：肺痿吐清稀涎沫、属虚；肺痈吐腥臭脓痰、属实热']
}
