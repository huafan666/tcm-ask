module.exports = {
  name: 'dahuang_mudan_tang',
  title: '大黄牡丹汤',
  kind: 'formula',
  // 金匮要略·疮痈肠痈浸淫病脉证并治第十八：肠痈者，少腹肿痞，按之即痛如淋，小便自调，时时发热，自汗出，复恶寒。其脉迟紧者，脓未成，可下之，当有血。脉洪数者，脓已成，不可下也，大黄牡丹汤主之。
  needs: [
    ['lower_abdomen_swelling_pain.yes', 'fever.yes', 'sweat.yes'],
    ['lower_abdomen_swelling_pain.yes', 'severe_abdominal_pain.yes'],
    ['chang_yong.yes', 'constipation.yes']
  ],
  contraindications: ['治肠痈**脓未成**阶段：少腹肿痞、按之剧痛、发热自汗、恶寒', '五味：大黄、芒硝、桃仁、牡丹皮、冬瓜仁——**泻热破瘀、散结消痈**', '原文的用药时机最关键：「**脉迟紧者，脓未成，可下之，当有血；脉洪数者，脓已成，不可下也**」——脓还没成就用下法把它消掉；脓已经成了就不能再峻下，改用薏苡附子败酱散', '这是「痈未成可下、已成不可下」的经典判据', '⚠ 急性阑尾炎属外科急症，出现穿孔征象（腹肌紧张、反跳痛）必须立即手术，不能服药观察']
}
