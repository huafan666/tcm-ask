module.exports = {
  name: 'li_jie_bing',
  title: '历节病',
  kind: 'summary',
  // 金匮要略·中风历节病脉证并治第五：诸肢节疼痛，身体魁羸，脚肿如脱……历节痛，不可屈伸……病历节不可屈伸，疼痛。
  needs: [
    ['joint_pain_rigid.yes'],
    ['joint_pain_rigid.yes', 'joint_swelling.yes'],
    ['joint_pain_rigid.yes', 'foot_swelling_drop.yes', 'weight_loss.yes'],
    ['joint_pain_rigid.yes', 'yellow_sweat.yes']
  ],
  contraindications: ['历节病是关节剧烈疼痛、疼得伸不直弯不下，好比疼痛在关节之间「逐个遍历」，所以叫历节', '典型组合：多个关节疼 + 关节肿大变形 + 身体反而瘦弱 + 两脚浮肿得厉害（原文：脚肿如脱）', '病因是汗出时受了风冷，或汗出入水，寒湿侵入关节；原文还说「饮酒汗出当风」也是常见诱因', '和一般风湿关节痛的区别：历节有明显的关节变形和全身消瘦', '主方桂枝芍药知母汤（风湿化热、关节肿痛）和乌头汤（寒湿偏重、剧痛不得屈伸）']
}
