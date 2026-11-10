module.exports = {
  name: 'shengjiang_banxia_tang',
  title: '生姜半夏汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：病人胸中似喘不喘，似呕不呕，似哕不哕，彻心中愦愦然无奈者，生姜半夏汤主之。
  needs: [
    ['chest_indescribable.yes'],
    ['chest_indescribable.yes', 'vomiting.yes'],
    ['chest_indescribable.yes', 'chest_qi_stuffiness.yes']
  ],
  contraindications: ['治一种「说不清」的不适：像喘又不是喘、想吐又吐不出、想打嗝又打不出，心里烦乱得无可奈何（原文：彻心中愦愦然无奈）', '只有两味：生姜（重用，取汁）、半夏。生姜用量比小半夏汤更大，取「散饮力猛」之意', '原文服法讲究：「以水三升，煮半夏取二升，内生姜汁，煮取一升半，小冷，分四服」——**放温凉一点、分四次慢慢喝**，避免一次喝多反而更呕', '和小半夏汤的区别：小半夏汤治「呕而不渴」；本方治「欲呕不呕」的闷乱感']
}
