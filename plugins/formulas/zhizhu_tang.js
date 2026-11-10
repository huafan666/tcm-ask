module.exports = {
  name: 'zhizhu_tang',
  title: '枳术汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：心下坚，大如盘，边如旋盘，水饮所作，枳术汤主之。枳实七枚，白术二两。
  needs: [
    ['epigastric_mass_plate.yes', 'abdominal_fullness.yes'],
    ['epigastric_mass_plate.yes']
  ],
  contraindications: ['治气分而偏**气滞水停**者：心口下盘大硬结', '只有两味：枳实（七枚，破气消痞）、白术（二两，健脾燥湿）', '枳实用量大于白术，重点在**行气**；比例妙在「气行则水行」', '原文服法是「以水五升，煮取三升，分温三服，腹中软即当散也」——吃到腹部变软就是有效', '后世「枳术丸」（白术倍枳实）就是从这首方化出的健脾消痞名方，但比例正好相反']
}
