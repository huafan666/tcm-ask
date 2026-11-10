module.exports = {
  name: 'yang_du',
  title: '阳毒',
  kind: 'summary',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：阳毒之为病，面赤斑斑如锦纹，咽喉痛，唾脓血。
  needs: ['face_red_patches.yes', 'throat_pain.yes', 'tu_nongxue.yes'],
  contraindications: ['阳毒是疫毒热邪暴发的一种急重病：脸上起一片片红斑像锦缎花纹，咽喉剧痛，咳吐脓血', '热毒极盛、来势很凶，原文说「五日可治，七日不可治」——要尽早处理', '不是普通上火，也不是一般外感发热']
}
