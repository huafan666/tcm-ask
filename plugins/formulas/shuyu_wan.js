module.exports = {
  name: 'shuyu_wan',
  title: '薯蓣丸',
  kind: 'formula',
  // 金匮要略·血痹虚劳病脉证并治第六：虚劳诸不足，风气百疾，薯蓣丸主之。
  needs: [
    ['xu_lao.yes', 'wind_aversion.yes'],
    ['xu_lao.yes', 'body_pain.yes']
  ],
  contraindications: ['治虚劳各种不足，同时反复受风、浑身不舒服（原文叫「风气百疾」）', '二十多味的大方，但核心是薯蓣（山药）重用健脾，配四君子、四物等补气血，再加防风、桂枝等祛风', '特点是「补中有散」——正虚又兼风邪时用，一味补会恋邪，一味散会更虚', '做成丸药缓图，适合长期调养']
}
