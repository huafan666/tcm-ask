module.exports = {
  name: 'guizhi_tang',
  title: '桂枝汤',
  kind: 'formula',
  // 桂枝汤证核心 = 发热 + 汗出 + 恶风（脉象暂时不加）。
  // 不含喘判定：喘时(发热汗出恶风+喘) 桂枝汤与加厚朴杏仁汤同时输出，由使用者依经济/轻重取舍。
  // 但"仅喘、无桂枝证"不会定位到桂枝汤。
  needs: [
    ['fever.yes', 'sweat.yes', 'wind_aversion.yes', 'severe_thirst.no'],
    ['taiyang_disease.yes', 'sweat.yes', 'severe_thirst.no'],
    // 金匮 20.1：妇人得平脉……其人渴，不能食，无寒热，名妊娠，桂枝汤主之
    ['pregnancy.yes','vomiting.yes','low_appetite.yes'],
    // 金匮 21.8：产后风……头微痛，恶寒，时时有热，心下闷，干呕，汗出……可与阳旦汤（阳旦汤即桂枝汤）
    ['postpartum.yes','fever.yes','wind_aversion.yes','vomiting.yes']
  ],
  contraindications: ['服后当啜热粥覆取微汗', '忌大汗（以遍身漐漐微似有汗为佳）', '服桂枝汤吐者其后恐吐脓血', '表实无汗发热者忌用（麻黄证忌）']
}

