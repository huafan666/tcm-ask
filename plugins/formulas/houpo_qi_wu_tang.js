module.exports = {
  name: 'houpo_qi_wu_tang',
  title: '厚朴七物汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：病腹满，发热十日，脉浮而数，饮食如故，厚朴七物汤主之。
  needs: [
    ['abdominal_fullness.yes', 'fever.yes', 'low_appetite.no'],
    ['abdominal_fullness.yes', 'fever.yes']
  ],
  contraindications: ['治腹满同时还有发热（表邪未解 + 里已胀满），关键是「饮食如故」——还能吃得下，说明里实不重', '组成是桂枝汤去芍药 + 厚朴三物汤（厚朴、枳实、大黄）——表里双解，一面解表一面除满', '和厚朴三物汤的区别：厚朴三物汤只管里实胀满（痛而闭），没有发热表证', '脉浮数是表邪未尽的指征（脉象按口径不入条件）']
}
