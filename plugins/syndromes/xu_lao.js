module.exports = {
  name: 'xu_lao',
  title: '虚劳',
  kind: 'summary',
  // 金匮要略·血痹虚劳病脉证并治第六：夫男子平人，脉大为劳，极虚亦为劳……虚劳里急，悸、衄，腹中痛，梦失精，四肢酸疼，手足烦热，咽干口燥。
  needs: [
    ['weight_loss.yes', 'hand_foot_hot.yes', 'throat_dry.yes'],
    ['night_sweat.yes', 'semen_loss.yes'],
    ['abdominal_tension.yes', 'heart_palp.yes', 'hand_foot_hot.yes'],
    ['weight_loss.yes', 'skin_scaly.yes', 'low_appetite.yes']
  ],
  contraindications: ['虚劳不是一个病，是一大类「精气内伤、久虚不复」的状态：消瘦、没劲、盗汗、手足心热、口干、心慌', '原文反复强调「脉大为劳，极虚亦为劳」——脉大而无力也是虚，别被「脉大」骗成实证', '按兼症分几种走向：偏阳气虚（小建中汤、黄芪建中汤）、偏肾虚（八味肾气丸）、偏虚烦不眠（酸枣仁汤）、干血内结（大黄䗪虫丸）', '治疗大法是「缓中补虚」——慢慢补，不能猛补也不能猛攻', '和一般疲劳的区别：虚劳有明显的形体消瘦、盗汗、手足心热、脉象极虚，病程长']
}
