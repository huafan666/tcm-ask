module.exports = {
  name: 'painong_san',
  title: '排脓散',
  kind: 'formula',
  // 金匮要略·疮痈肠痈浸淫病脉证并治第十八：排脓散方：枳实十六枚，芍药六分，桔梗一分。
  needs: [
    ['chang_yong.yes', 'foul_pus_sputum.yes'],
    ['chang_yong.yes', 'lower_abdomen_swelling_pain.yes']
  ],
  contraindications: ['治痈脓已成、需要排脓外出者', '三味：枳实（破气散结）、芍药（和血）、桔梗（载药上行、排脓）', '桔梗是排脓的要药，后世「桔梗汤」排肺痈脓也用它', '原文用法：「杵为散，取鸡子黄一枚，以药散与鸡黄相等，揉和令相得，饮和服之，日一服」——用鸡子黄和药，取滋养之意', '和金匮 7.13 的桔梗汤（肺痈排脓）思路相通，但本方偏「通用排脓」']
}
