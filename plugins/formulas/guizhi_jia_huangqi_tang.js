module.exports = {
  name: 'guizhi_jia_huangqi_tang',
  title: '桂枝加黄芪汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：若身重，汗出已辄轻者，久久必身瞤，瞤即胸中痛，又从腰以上必汗出，下无汗，腰髋弛痛……此为黄汗，桂枝加黄芪汤主之。
  needs: [
    ['waist_split_sweat.yes', 'body_heavy.yes'],
    ['waist_split_sweat.yes', 'yellow_sweat.yes'],
    ['yellow_sweat.yes', 'muscle_twitching.yes', 'chest_stuffy.yes'],
    // 金匮 15.16：诸病黄家，但利其小便；假令脉浮，当以汗解之，宜桂枝加黄芪汤主之
    ['huang_dan.yes','wind_aversion.yes','sweat.yes']
  ],
  contraindications: ['治黄汗而阳气不足、表虚不固者', '桂枝汤（调和营卫）+ 黄芪（益气固表）', '原文描述很细：身体重、出汗后反而轻快、久了会肌肉跳动、跳动就胸中痛；**腰以上出汗、腰以下无汗**，腰髖松弛作痛，像有东西在皮肤里', '和芪芍桂酒汤区别：芪芍桂酒汤偏营分郁热（汗黄如柏汁、渴），本方偏表虚阳气不足（汗出色淡、腰上汗下无汗）', '严重时「不能食，身疼重，烦躁，小便不利」']
}
