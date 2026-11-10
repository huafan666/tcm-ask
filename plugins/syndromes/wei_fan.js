module.exports = {
  name: 'wei_fan',
  title: '胃反',
  kind: 'summary',
  // 金匮要略·呕吐哕下利病脉证并治第十七：脾伤则不磨，朝食暮吐，暮食朝吐，宿谷不化，名曰胃反……胃反呕吐者，大半夏汤主之。
  needs: [
    ['food_vomit_delayed.yes'],
    ['food_vomit_delayed.yes', 'low_appetite.yes'],
    ['food_vomit_delayed.yes', 'weight_loss.yes'],
    ['food_vomit_delayed.yes', 'thirsty.yes']
  ],
  contraindications: ['胃反就是「朝食暮吐，暮食朝吐」——早上吃的到晚上吐出来、晚上吃的早上吐出来，吐出来的还是没消化的「宿谷不化」', '病机是脾胃虚寒、不能腐熟运化，所以吃下去的东西停在那里不动，隔很久才吐出来', '和一般呕吐的区别：一般呕吐是吃完不久就吐；胃反是**隔了一顿甚至半天**才吐', '原文还强调「脉紧而涩，其病难治」——病程长、消瘦明显的胃反比较难治', '⚠ 这种「隔餐呕吐、吐出宿食」的表现，现代要高度警惕**幽门梗阻**（溃疡瘢痕或肿瘤所致），必须做胃镜']
}
