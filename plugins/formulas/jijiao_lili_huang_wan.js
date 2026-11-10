module.exports = {
  name: 'jijiao_lili_huang_wan',
  title: '己椒苈黄丸',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：腹满，口舌干燥，此肠间有水气，己椒苈黄丸主之。
  needs: [
    ['abdominal_fullness.yes', 'throat_dry.yes'],
    ['abdominal_fullness.yes', 'borborygmus.yes', 'throat_dry.yes']
  ],
  contraindications: ['治肠间有水气：肚子胀满，同时口舌干燥——这个组合很有意思，水明明很多却口渴，因为水停肠间、津液上不来', '四味：防己、椒目（利水）、葶苈子（泻肺行水）、大黄（通下）——前后分消，让水从大小便排出', '做成蜜丸（如梧子大，先食饮服一丸，日三服），「日三服，稍增，口中有津液渴者，加芒硝半两」', '原文的观察点：「先食饮服」——饭前服，且逐渐加量；口中出现津液、口渴缓解说明有效', '体虚、孕妇慎用']
}
