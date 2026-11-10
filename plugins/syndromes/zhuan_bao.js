module.exports = {
  name: 'zhuan_bao',
  title: '转胞',
  kind: 'summary',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人病饮食如故，烦热不得卧，而反倚息者……此名转胞，不得溺也。以胞系了戾，故致此病。但利小便则愈，宜肾气丸主之。
  needs: [
    ['urination_difficulty.yes', 'low_appetite.no'],
    ['urination_difficulty.yes', 'orthopnea.yes'],
    ['urination_difficulty.yes', 'restless.yes']
  ],
  contraindications: ['转胞：**想尿却尿不出来**（不得溺），伴心烦发热、躺不平、只能靠着呼吸', '原文强调「**饮食如故**」——能吃能喝，说明病不在中焦，而在下焦膀胱', '病机是「胞系了戾」——膀胱系带扭转、气化不行（古人形象的说法）', '治法「但利小便则愈」，用肾气丸温阳化气——不是利尿药，而是**恢复膀胱的气化功能**', '⚠ 突然尿不出来（急性尿潴留）属急症，须立即导尿，尤其产后、术后常见']
}
