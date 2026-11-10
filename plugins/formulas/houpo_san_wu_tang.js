module.exports = {
  name: 'houpo_san_wu_tang',
  title: '厚朴三物汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：痛而闭者，厚朴三物汤主之。
  needs: [
    ['abdominal_pain.yes', 'constipation.yes'],
    ['abdominal_fullness.yes', 'constipation.yes', 'abdominal_pain.yes']
  ],
  contraindications: ['治「痛而闭」——肚子痛 + 大便不通。两个条件就是全部', '厚朴、枳实、大黄三味，但**厚朴用量最重**（八两）——重点在行气除满，不是单纯泻下', '和小承气汤（大黄、厚朴、枳实）的区别：药味相同但剂量不同，小承气重在泻热通便，厚朴三物汤重在行气消满', '和厚朴七物汤区别：本方无发热表证']
}
