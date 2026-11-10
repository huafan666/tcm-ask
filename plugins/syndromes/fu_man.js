module.exports = {
  name: 'fu_man',
  title: '腹满',
  kind: 'summary',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：病者腹满，按之不痛为虚，痛者为实，可下之……腹满时减，复如故，此为寒，当与温药……腹满不减，减不足言，当须下之。
  needs: [
    ['abdominal_fullness.yes', 'abdominal_pain.yes'],
    ['abdominal_fullness.yes', 'severe_abdominal_pain.yes'],
    ['abdominal_fullness.yes', 'cold_aversion.yes']
  ],
  contraindications: ['腹满要分虚实，原文给了最实用的手法：**按之不痛是虚，按之痛是实**', '实证可以用下法（大黄、厚朴、枳实之类）；虚寒证要用温药，不能用下法', '原文还给了寒证的判据：「腹满时减，复如故」——胀满一会儿轻、一会儿又恢复原样，说明是寒气，当用温药', '反过来「腹满不减，减不足言」——胀满一直不消、稍微轻一点也等于没轻，那是实证壅结，必须下', '「舌黄未下者，下之黄自去」——舌苔黄是里实热的指征，泻下之后黄苔会自然退掉']
}
