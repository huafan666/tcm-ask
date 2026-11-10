module.exports = {
  name: 'xiaobanxia_tang',
  title: '小半夏汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：呕家本渴，渴者为欲解，今反不渴，心下有支饮故也，小半夏汤主之。
  needs: [
    ['vomiting.yes', 'thirsty.no'],
    ['vomiting.yes', 'saliva_spit.yes']
  ],
  contraindications: ['治支饮呕吐。原文的推理很妙：**呕吐的人本来应该口渴**（吐伤了津液），如果口渴说明饮邪要解；现在反而不渴，说明心下停着支饮，水饮上逆才吐，所以用小半夏汤', '只有两味：半夏（一升，重用）降逆止呕，生姜（半斤）散饮止呕', '是「治呕」的祖方，后世无数止呕方都由它化出', '「不渴」是本方的核心指征——口渴的呕吐不适用']
}
