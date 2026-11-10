module.exports = {
  name: 'dawutou_jian',
  title: '大乌头煎',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：寒疝绕脐痛，若发则白汗出，手足厥冷，其脉沉紧者，大乌头煎主之。
  needs: [
    ['circumumbilical_pain.yes', 'cold_sweat.yes', 'cold_extremities.yes'],
    ['han_shan.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治寒疝重证：绕脐剧痛、疼得冒冷汗、手脚冰凉', '只有乌头一味，加蜜久煎——「乌头五枚，以水三升，煮取一升，去滓，内蜜二升，煎令水气尽」', '**乌头大毒**：必须用蜜煎到「水气尽」以减毒，绝不可生用或自行加量', '原文警告「强人服七合，弱人服五合。不差，明日更服，不可一日再服」——一天只能服一次', '中毒表现：唇舌四肢发麻、心慌、心律不齐、血压下降，须立即就医；孕妇绝对忌用']
}
