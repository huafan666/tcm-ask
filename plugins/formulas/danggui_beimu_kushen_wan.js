module.exports = {
  name: 'danggui_beimu_kushen_wan',
  title: '当归贝母苦参丸',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妊娠，小便难，饮食如故，当归贝母苦参丸主之。
  needs: [
    ['pregnancy.yes', 'urination_difficulty.yes', 'low_appetite.no'],
    ['pregnancy.yes', 'urination_difficulty.yes']
  ],
  contraindications: ['治妊娠小便困难。原文特意强调「**饮食如故**」——能吃能喝，说明病不在中焦脾胃，而在下焦膀胱', '三味：当归（养血润燥）、贝母（宣肺利气、开上以通下）、苦参（清利下焦湿热）', '「开上窍以通下窍」：肺为水之上源，贝母宣肺则水道自通', '做成蜜丸「如小豆大，饮服三丸，加至十丸」', '⚠ 妊娠期尿路问题也要查尿常规，排除感染']
}
