module.exports = {
  name: 'guizhi_shaoyao_zhimu_tang',
  title: '桂枝芍药知母汤',
  kind: 'formula',
  // 金匮要略·中风历节病脉证并治第五：诸肢节疼痛，身体魁羸，脚肿如脱，头眩短气，温温欲吐，桂枝芍药知母汤主之。
  needs: [
    ['joint_pain_rigid.yes', 'joint_swelling.yes'],
    ['joint_pain_rigid.yes', 'foot_swelling_drop.yes'],
    ['joint_pain_rigid.yes', 'dizziness.yes', 'short_breath.yes']
  ],
  contraindications: ['治历节病偏风湿化热：多个关节疼、关节肿大、身体消瘦、两脚浮肿得厉害，还伴头晕、气短、恶心想吐', '桂枝、麻黄、附子温通散寒，芍药、知母清热养阴——寒热并调，因为风湿久郁已经化热', '和乌头汤区别：本方偏关节肿大、有热象；乌头汤偏剧痛拘急、寒象明显', '附子有毒，须久煎']
}
