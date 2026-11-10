module.exports = {
  name: 'yinchen_wuling_san',
  title: '茵陈五苓散',
  kind: 'formula',
  // 金匮要略·黄疸病脉证并治第十五：黄疸病，茵陈五苓散主之。
  needs: [
    ['jaundice.yes', 'urination_difficulty.yes'],
    ['huang_dan.yes', 'urination_difficulty.yes', 'thirsty.yes']
  ],
  contraindications: ['治黄疸而湿重于热者：以身黄、小便不利为主，热象不重', '五苓散（利水化气）+ 茵陈（利湿退黄），是「利小便以退黄」的典型组合', '原文总纲「诸病黄家，但利其小便」——本方正是这条总纲的代表方', '和茵陈蒿汤的区别：茵陈蒿汤有大黄、偏湿热俱盛（腹满、大便不通）；本方偏湿重、以小便不利为主', '原文是散剂（茵陈蒿末十分、五苓散五分，先食饮服方寸匕，日三服）']
}
