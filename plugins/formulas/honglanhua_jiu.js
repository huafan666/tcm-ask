module.exports = {
  name: 'honglanhua_jiu',
  title: '红蓝花酒',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人六十二种风，及腹中血气刺痛，红蓝花酒主之。
  needs: [
    ['abdominal_pain.yes', 'fixed_mass.yes'],
    ['abdominal_pain.yes', 'migratory_pain.no'],
    ['lower_abdomen_cramp.yes', 'abdominal_pain.yes']
  ],
  contraindications: ['治「腹中血气刺痛」——**痛如针刺、位置固定**的血瘀性腹痛', '只有一味：红蓝花（即红花），用酒一大升煎，「顿服一半，未止再服」', '红花活血通经，酒助其行散——是活血止痛的极简方', '「妇人六十二种风」是古人对妇科杂症的泛称', '⚠ 孕妇禁用（红花活血，有堕胎之弊）；有出血倾向者忌用']
}
