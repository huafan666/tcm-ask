module.exports = {
  name: 'xuan_yin',
  title: '悬饮',
  kind: 'summary',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：饮后水流在胁下，咳唾引痛，谓之悬饮……脉沉而弦者，悬饮内痛……病悬饮者，十枣汤主之。
  needs: [
    ['cough_pleuritic_pain.yes'],
    ['cough_pleuritic_pain.yes', 'hypochondriac_fullness.yes']
  ],
  contraindications: ['四饮之一。悬饮是水饮停在**胁下**，像悬挂在胸胁之间，所以叫「悬」', '典型表现：咳唾引痛——一咳嗽、一吐痰，胁下就牵扯着痛', '原文还有「脉沉而弦者，悬饮内痛」（脉象按口径不入条件）', '对应现代医学的胸腔积液一类情况', '主治方十枣汤是峻下逐水的猛方，必须严格掌握', '⚠ 悬饮伴气促、不能平卧、一侧胸廓饱满的，务必先做影像检查明确诊断']
}
