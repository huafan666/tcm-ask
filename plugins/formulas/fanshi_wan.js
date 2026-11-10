module.exports = {
  name: 'fanshi_wan',
  title: '矾石丸',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人经水闭不利，脏坚癖不止，中有干血，下白物，矾石丸主之。
  needs: [
    ['amenorrhea.yes', 'fixed_mass.yes', 'vaginal_discharge.yes'],
    ['vaginal_discharge.yes', 'fixed_mass.yes']
  ],
  contraindications: ['治经闭不行、腹中有坚癖块、干血内结而出现**白带增多**（下白物）', '**这是外用的坐药（阴道栓剂）**：矾石（白矾）烧过研末，用杏仁泥和成枣核大，纳阴中', '矾石收敛燥湿止带，外用治带下；干血内结则需另配内服药', '⚠ 明确是**外用**，不可内服', '⚠ 现代阴道分泌物异常要先查**阴道炎、宫颈病变**，做白带常规和宫颈筛查']
}
