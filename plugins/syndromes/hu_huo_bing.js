module.exports = {
  name: 'hu_huo_bing',
  title: '狐惑病',
  kind: 'summary',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：狐蜮之为病，状如伤寒，默默欲眠，目不得闭，卧起不安，蚀于喉为蜮，蚀于阴为狐，不欲饮食，恶闻食臭，其面目乍赤、乍黑、乍白。
  needs: [
    ['eyes_cannot_close.yes', 'sleepy.yes'],
    ['throat_ulcer.yes', 'voice_hoarse.yes'],
    ['genital_ulcer.yes', 'anal_ulcer.yes'],
    ['face_color_fluctuating.yes', 'eyes_cannot_close.yes']
  ],
  contraindications: ['狐惑病的样子很像外感伤寒（发热、没劲、不想吃饭），但又不是伤寒，查不出外感的原因', '最典型的是「想睡却闭不上眼」——很困、眼皮合不上，睡也睡不踏实', '再有就是黏膜溃烂：烂在喉咙叫「蜮」（会声音嘶哑），烂在前后阴叫「狐」（原文叫蚀于阴为狐）', '整个病程里脸色会忽红、忽黑、忽白地变来变去', '病机是湿热虫毒蕴结，不是单纯虚证，别一味补', '主方甘草泻心汤；烂在下身用苦参汤外洗，烂在肛门用雄黄熏']
}
