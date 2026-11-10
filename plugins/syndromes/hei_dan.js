module.exports = {
  name: 'hei_dan',
  title: '黑疸',
  kind: 'summary',
  // 金匮要略·黄疸病脉证并治第十五：酒疸下之，久久为黑疸，目青面黑，心中如啖蒜虀状，大便正黑，皮肤爪之不仁。
  needs: [
    ['face_black.yes', 'black_stool.yes'],
    ['jaundice.yes', 'face_black.yes', 'limb_numbness.yes'],
    ['face_black.yes', 'vex_insomnia.yes']
  ],
  contraindications: ['黑疸是黄疸久治不愈、瘀血内停的转归，多由酒疸误下发展而来，所以原文说「酒疸下之，久久为黑疸」', '「黑」体现在两处：**目青面黑**（脸色发黑暗）、**大便正黑**', '还有「心中如啖蒜虀状」——心里像吃了生蒜一样辛辣不适；「皮肤爪之不仁」——皮肤知觉迟钝', '病机是湿热日久、由气分入血分、瘀血内结', '⚠ 面色黧黑伴黑便，在现代要高度警惕肝硬化失代偿、消化道出血等，必须及时就医']
}
