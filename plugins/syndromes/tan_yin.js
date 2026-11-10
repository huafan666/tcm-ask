module.exports = {
  name: 'tan_yin',
  title: '痰饮',
  kind: 'summary',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：其人素盛今瘦，水走肠间，沥沥有声，谓之痰饮。
  needs: [
    ['weight_loss.yes', 'borborygmus.yes'],
    ['borborygmus.yes', 'body_heavy.yes'],
    ['borborygmus.yes', 'chest_qi_stuffiness.yes']
  ],
  contraindications: ['四饮之一。痰饮的定义是「素盛今瘦，水走肠间，沥沥有声」——原来胖、现在瘦了，肚子里咕噜咕噜响', '关键在水停在**胃肠**，所以表现是肠鸣、消瘦、身体沉重', '治则原文给了一句话：「病痰饮者，当以温药和之」——痰饮属阴邪，要用温药慢慢化解，不能猛攻', '和悬饮（水在胁下）、溢饮（水在四肢）、支饮（水在胸膈）的部位不同', '⚠ 中医的「痰饮」是水液代谢失常的产物，不等于西医的「痰」']
}
