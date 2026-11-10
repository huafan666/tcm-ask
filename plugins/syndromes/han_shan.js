module.exports = {
  name: 'han_shan',
  title: '寒疝',
  kind: 'summary',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：腹痛，脉弦而紧……恶寒，紧则不欲食，邪正相搏，即为寒疝。寒疝绕脐痛，若发则白汗出，手足厥冷。
  needs: [
    ['abdominal_pain.yes', 'cold_aversion.yes', 'low_appetite.yes'],
    ['circumumbilical_pain.yes', 'cold_sweat.yes'],
    ['abdominal_pain.yes', 'cold_extremities.yes']
  ],
  contraindications: ['寒疝不是现代说的「疝气」——它是**阴寒内盛引起的剧烈腹痛**，痛起来绕肚脐一圈', '发作时的样子：疼得出一身冷汗（原文叫「白汗出」）、手脚冰凉（手足厥冷）', '病机是「邪正相搏」——阴寒之邪与正气在里相争，所以又痛又怕冷又不想吃饭', '和治疗疝气（小茴香、橘核之类理气）完全不是一回事，这里要用大辛大热温散', '⚠ 这种剧烈腹痛同样要排除急腹症（肠梗阻、胰腺炎、阑尾炎等），别只顾温阳']
}
