module.exports = {
  name: 'zhizi_dahuang_tang',
  title: '栀子大黄汤',
  kind: 'formula',
  // 金匮要略·黄疸病脉证并治第十五：酒黄疸，心中懊憹或热痛，栀子大黄汤主之。
  needs: [
    ['jiu_dan.yes', 'vex_insomnia.yes'],
    ['jiu_dan.yes', 'heart_hot.yes', 'chest_qi_stuffiness.yes']
  ],
  contraindications: ['治酒疸：心里烦闷懊憹、甚至热痛', '四味：栀子、大黄、枳实、豉——清热除烦、通利湿热', '和茵陈蒿汤的区别：茵陈蒿汤以茵陈为君、重在利湿退黄；本方以栀子为君、重在清心除烦，适合酒疸热象重、心中懊憹明显者', '服法「分温三服」，得下即停']
}
