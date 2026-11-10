module.exports = {
  name: 'dan_nue',
  title: '瘅疟',
  kind: 'summary',
  // 金匮要略·疟病脉证并治第四：阴气孤绝，阳气独发，则热而少气烦冤，手足热而欲呕，名曰瘅疟，若但热不寒者……令人消铄脱肉。
  needs: [
    ['heat_only_no_chill.yes', 'hand_foot_hot.yes'],
    ['heat_only_no_chill.yes', 'weight_loss.yes']
  ],
  contraindications: ['瘅疟的特点是「但热不寒」——只发热、完全不发冷（原文叫阳气独发、阴气孤绝）', '热得厉害还伴气短、心里烦闷委屈（少气烦冤），手脚心发烫，恶心想吐', '日子久了会明显消瘦（原文：令人消铄脱肉），因为热在消耗肌肉', '和温疟的区别：温疟还带着骨节疼烦、时呕（表证未尽）；瘅疟是里热独盛、已经伤到阴', '本条只出证候，原文没有给方']
}
