module.exports = {
  name: 'mahuang_fuzi_tang',
  title: '麻黄附子汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：水之为病，其脉沉小，属少阴……脉沉者宜麻黄附子汤。
  needs: [
    ['pitting_edema.yes', 'cold_extremities.yes'],
    ['pitting_edema.yes', 'cold_aversion.yes', 'no_sweat.yes']
  ],
  contraindications: ['治水气病属少阴（肾阳虚）者：水肿而脉沉小', '即麻黄附子甘草汤（麻黄、附子、甘草）——温经发汗，助阳散水', '和甘草麻黄汤的区别：本方有附子，针对**阳虚**；纯表实无汗才用甘草麻黄汤', '附子有毒须炮制久煎', '原文强调「水，发其汗即已」——但阳虚的水肿发汗必须配温阳，不能单用麻黄']
}
