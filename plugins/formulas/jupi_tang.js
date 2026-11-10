module.exports = {
  name: 'jupi_tang',
  title: '橘皮汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：干呕、哕，若手足厥者，橘皮汤主之。
  needs: [
    ['hiccup.yes', 'cold_extremities.yes'],
    ['hiccup.yes', 'vomiting.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治干呕、打嗝而手足发凉的情况', '只有两味：橘皮（行气降逆）、生姜（散寒止呕）', '手足发凉的机理很有意思：**不是阳虚，而是气逆阻隔**，阳气被堵在里面送不到四肢。所以气一降、手足自然回暖，原文说「温服一升，下咽即愈」', '和四逆汤的区别：四逆汤是真阳虚、手足厥冷伴下利清谷；本方是气逆导致的厥，没有虚寒下利']
}
