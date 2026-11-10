module.exports = {
  name: 'jiaojiang_tang',
  title: '胶姜汤',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人陷经，漏下黑不解，胶姜汤主之。
  needs: [
    ['vaginal_bleeding.yes', 'poor_complexion.yes'],
    ['vaginal_bleeding.yes', 'cold_extremities.yes'],
    ['lou_xia.yes', 'blood_clot_dark.yes']
  ],
  contraindications: ['治「陷经」：**漏下不止、血色发黑而久不愈**（陷＝下陷不升）', '**原方组成未见于《金匮》正文**，只留方名。后世多认为是阿胶+干姜（故称胶姜汤），也有认为是胶艾汤类', '「漏下黑不解」的病机是冲任虚寒、瘀血内停——血色黑说明有寒有瘀，所以要用阿胶养血、干姜温经', '⚠ 方药组成不确定，实际用药须由医师据证拟定']
}
