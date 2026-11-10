module.exports = {
  name: 'gualou_qumai_wan',
  title: '栝蒌瞿麦丸',
  kind: 'formula',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：小便不利者，有水气，其人若渴，栝蒌瞿麦丸主之。
  needs: [
    ['urination_difficulty.yes', 'thirsty.yes'],
    ['urination_difficulty.yes', 'throat_dry.yes']
  ],
  contraindications: ['治小便不利而**同时口渴**——上焦燥热、下焦有水气，水停在下、津不上承，所以既尿不出又口渴', '栝蒌根（天花粉）生津止渴，瞿麦、茯苓利水，附子温阳化气，薯蓣（山药）补脾益肾', '做成蜜丸（梧子大），「饮服三丸，日三服，不知，增至七八丸，以小便利、腹中温为知」——以小便通、腹中温暖为见效标准', '关键是寒热并用：上面要生津、下面要温阳利水']
}
