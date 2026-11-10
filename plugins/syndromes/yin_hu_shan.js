module.exports = {
  name: 'yin_hu_shan',
  title: '阴狐疝',
  kind: 'summary',
  // 金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九：阴狐疝气者，偏有小大，时时上下，蜘蛛散主之。
  needs: [
    ['testicle_alternating_swelling.yes'],
    ['testicle_alternating_swelling.yes', 'abdominal_pain.yes'],
    ['testicle_alternating_swelling.yes', 'cold_extremities.yes']
  ],
  contraindications: ['阴狐疝就是**疝气**：腹股沟或阴囊时大时小，一用力、一哭闹就鼓出来，躺下又能回去', '原文说「偏有小大，时时上下」——偏于一侧、一大一小，而且**能上能下**（疝块来回出入）', '「狐」这个字形容它像狐狸一样**出没无常、来去不定**', '和寒疝的区别：寒疝（第十篇）是阴寒腹痛，跟疝气不是一回事；本条才是真正的外疝', '⚠ 疝块**推不回去、剧痛、伴呕吐**是嵌顿疝，属外科急症，必须立即急诊手术']
}
