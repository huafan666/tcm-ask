module.exports = {
  name: 'guizhi_fuzi_tang',
  title: '桂枝附子汤',
  kind: 'formula',
  // 第174条: 伤寒八九日风湿相搏，身体疼烦不能自转侧，不呕不渴脉浮虚而涩者，桂枝附子汤主之。
  // 风湿在表、身体疼烦不能转侧。
  needs: [
    ['body_ache_stiff.yes'],
    ['body_ache_stiff.yes', 'joint_pain_rigid.yes']
  ],
  contraindications: ['风湿相搏、身疼不能转侧', '不呕不渴', '祛风散寒除湿(桂枝+附子)']
}
