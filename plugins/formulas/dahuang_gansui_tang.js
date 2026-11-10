module.exports = {
  name: 'dahuang_gansui_tang',
  title: '大黄甘遂汤',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人少腹满如敦状，小便微难而不渴，生后者，此为水与血俱结血室也，大黄甘遂汤主之。
  needs: [
    ['abdominal_fullness.yes', 'urination_difficulty.yes', 'thirsty.no'],
    ['lower_abdomen_swelling_pain.yes', 'urination_difficulty.yes'],
    ['abdominal_fullness.yes', 'fixed_mass.yes', 'thirsty.no']
  ],
  contraindications: ['治「水与血俱结在血室」：**少腹满得像倒扣的敦（古代器皿）形状、小便略微困难、口不渴**', '「生后者」指产后（或产后不久）出现这种情况', '三味：大黄、甘遂、阿胶——**大黄、甘遂依法水，阿胶护阴血**', '关键在「水血互结」：单纯利水不行、单纯化瘀也不行，必须两者同攻，同时用阿胶防伤正', '⚠ **甘遂有毒、峻下逐水**，用量须极严格；孕妇绝对禁用；体虚者忌用']
}
