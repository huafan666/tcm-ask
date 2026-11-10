module.exports = {
  name: 'zang_zao',
  title: '脏躁',
  kind: 'summary',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人脏躁，喜悲伤欲哭，象如神灵所作，数欠伸，甘麦大枣汤主之。
  needs: [
    ['sad_cry_easily.yes'],
    ['sad_cry_easily.yes', 'frequent_yawning.yes'],
    ['sad_cry_easily.yes', 'restless.yes'],
    ['sad_cry_easily.yes', 'vex_insomnia.yes']
  ],
  contraindications: ['脏躁：**喜悲伤欲哭、象如神灵所作、数欠伸**——老想哭、情绪不能自主（像有神灵作祟）、还不停打哈欠伸懒腰', '病机是脏阴不足、心神失养（「脏」指五脏之阴，「躁」是躁动不安）', '甘麦大枣汤只有三味：甘草、小麦、大枣——**甘润缓急、养心安神**，是极平和的方子', '原文虽写在妇人篇，但男女都可出现；多见于更年期、情绪波动大、产后或久病体虚者', '⚠ 长期情绪低落、兴趣丧失、有自伤念头的，要考虑抑郁症，须精神心理科评估，不能只服中药']
}
