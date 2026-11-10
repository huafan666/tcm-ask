module.exports = {
  name: 'zhugao_fajian',
  title: '猪膏发煎',
  kind: 'formula',
  // 金匮要略·黄疸病脉证并治第十五：诸黄，猪膏发煎主之。
  needs: [
    ['huang_dan.yes', 'constipation.yes'],
    ['jaundice.yes', 'skin_scaly.yes']
  ],
  contraindications: ['治「诸黄」而偏于津枯燥结者——方名就是两味：猪膏（猪油）、乱发（血余）', '猪油润燥、乱发（血余）消瘀利水，是「润以通之」的思路，适合干枯燥结的黄疸', '原文用法：「猪膏半斤、乱发如鸡子大三枚，和膏中煎之，发消药成，分再服，病从小便出」', '偏燥、偏干瘦的黄疸适用；湿热壅盛、大便不通的实证不宜']
}
