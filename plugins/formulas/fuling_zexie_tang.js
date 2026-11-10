module.exports = {
  name: 'fuling_zexie_tang',
  title: '茯苓泽泻汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：胃反，吐而渴欲饮水者，茯苓泽泻汤主之。
  needs: [
    ['food_vomit_delayed.yes', 'thirsty.yes'],
    ['vomiting.yes', 'thirsty.yes', 'dizziness.yes']
  ],
  contraindications: ['治胃反而「吐而渴欲饮水」——一边吐、一边又口渴想喝水，喝下去又可能再吐', '茯苓、泽泻、白术、桂枝、甘草、生姜——利水化气、温中降逆', '这是五苓散类方：核心是**水饮内停、气化不利**，所以既吐又渴', '和猪苓散的区别：猪苓散偏轻（吐后想水）；本方水饮更重，吐与渴并存', '和茯苓泽泻汤同名方在别处也有，注意本条是金匮原方']
}
