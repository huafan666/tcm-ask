module.exports = {
  name: 'qishao_guijiu_tang',
  title: '芪芍桂酒汤（耆芍桂酒汤）',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：黄汗之为病，身体肿，发热汗出而渴，状如风水，汗沾衣，色正黄如柏汁……宜耆芍桂酒汤主之。
  needs: [
    ['yellow_sweat.yes', 'pitting_edema.yes'],
    ['yellow_sweat.yes', 'sweat.yes', 'thirsty.yes']
  ],
  contraindications: ['治黄汗：汗出色黄如柏汁、染黄衣服，身体浮肿，发热汗出而渴', '三味：黄芪（益气固表）、芍药（和营）、桂枝（通阳），加苦酒（醋）同煎', '苦酒（醋）的作用是「以酸收之」，助药力入营分、敛汗', '原文服法：「温服一升，当心烦，服至六七日乃解。若心烦不止者，以苦酒阻故也」——服药后心烦是正常反应，六七天自解', '⚠ 汗色发黄须先排除黄疸（查肝功能、胆红素）']
}
