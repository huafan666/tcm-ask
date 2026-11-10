module.exports = {
  name: 'yin_du',
  title: '阴毒',
  kind: 'summary',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：阴毒之为病，面目青，身痛如被杖，咽喉痛。
  needs: ['poor_complexion.yes', 'body_pain.yes', 'throat_pain.yes'],
  contraindications: ['阴毒同样是疫毒急重病，但偏寒、偏阴：脸色和眼睛周围发青，身上痛得像被棍子打过，咽喉也痛', '和阳毒区别在于：阳毒面红起斑、吐脓血；阴毒面青、身痛剧烈、没有斑和脓血', '同样是「五日可治，七日不可治」，要早处理']
}
