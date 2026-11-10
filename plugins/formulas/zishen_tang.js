module.exports = {
  name: 'zishen_tang',
  title: '紫参汤',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：下利肺痛，紫参汤主之。
  needs: [
    ['diarrhea.yes', 'chest_back_pain.yes'],
    ['diarrhea.yes', 'chest_qi_stuffiness.yes']
  ],
  contraindications: ['治「下利肺痛」——一边拉肚子、一边胸肺部位疼痛', '只有两味：紫参（即拳参，清热解毒、凉血止痢）、甘草', '「肺痛」的病机解释不一：有认为是肺与大肠相表里、肠中热毒上攻于肺；也有认为「肺」是「腹」之误', '紫参现代多用于痢疾、肠炎，属清热解毒类', '⚠ 本条历来有争议，实际用药须由医师判断']
}
