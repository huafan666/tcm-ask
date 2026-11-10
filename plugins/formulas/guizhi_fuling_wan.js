module.exports = {
  name: 'guizhi_fuling_wan',
  title: '桂枝茯苓丸',
  kind: 'formula',
  // 
  needs: [
    ['vaginal_bleeding.yes', 'fixed_mass.yes'],
    ['lou_xia.yes', 'fixed_mass.yes'],
    ['vaginal_bleeding.yes', 'lower_abdomen_cramp.yes'],
    ['tongjing.yes', 'duzijiaotonghuocitong.yes']
  ],
  contraindications: ['治「症痼害」：瘀血结成的固定包块导致漏下不止——瘀不去则血不止，所以要**化瘀消症**', '五味等分：桂枝、茯苓、牡丹皮、桃仁、芍药——活血化瘀、缓消症块', '做成蜜丸小量服，「每日食前服一丸，不知，加至三丸」——**缓消渐磨，不猛攻**', '原文方后注有重要一句：「**妊娠六月动者……当以附子汤温其脏**」之外的辨别，说明妊娠期用它必须极为审慎', '⚠ 本方活血力强，**孕妇须在医师指导下使用**，不可自行服用；有出血倾向者忌用', '旧版本还有一条痛经用法（痛经 + 绞痛），已并入本节点']
}
