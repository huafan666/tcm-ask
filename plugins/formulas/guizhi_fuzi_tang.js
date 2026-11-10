module.exports = {
  name: 'guizhi_fuzi_tang',
  title: '桂枝附子汤',
  kind: 'formula',
  // 第174条: 伤寒八九日风湿相搏，身体疼烦不能自转侧，不呕不渴脉浮虚而涩者，桂枝附子汤主之。
  // 风湿在表、身体疼烦不能转侧。
  needs: [
    ['body_ache_stiff.yes', 'thirsty.no', 'vomiting.no'],
    ['body_ache_stiff.yes', 'joint_pain_rigid.yes', 'thirsty.no', 'vomiting.no']
  ],
  contraindications: ['风湿在表、表阳虚（身体疼烦、不能自转侧）', '不渴是排除里热的关键鉴别（原文「不呕不渴」；呕属伴随症，不进条件）', '与去桂加白术汤的区别：本方无大便坚；大便坚而小便自利者去桂加白术', '温经散寒除湿（桂枝+附子）']
}
