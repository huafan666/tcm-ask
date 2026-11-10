module.exports = {
  name: 'mahuang_chunjiu_tang',
  title: '麻黄醇酒汤',
  kind: 'formula',
  // 金匮要略·黄疸病脉证并治第十五：《千金》麻黄醇酒汤：治黄疸。麻黄三两。
  needs: [
    ['jaundice.yes', 'no_sweat.yes'],
    ['huang_dan.yes', 'no_sweat.yes', 'wind_aversion.yes']
  ],
  contraindications: ['出自《千金》方，附于《金匮》黄疸篇末：治黄疸，只有麻黄一味，用醇酒（美酒）煎煮', '取「以汗解之」的思路——原文总纲说「假令脉浮，当以汗解之」', '酒能助麻黄发散，同时酒本身行气血', '⚠ 只适合表闭无汗的黄疸；有汗、体虚、心肝功能不佳者忌用（麻黄发汗峻烈，酒也伤肝）', '⚠ 黄疸患者多有肝损伤，饮酒本应避免——本方的酒是煎药溶媒且量小，绝不可自行服用']
}
