module.exports = {
  name: 'guizhi_tang',
  title: '桂枝汤',
  kind: 'formula',
  // 桂枝汤证核心 = 发热 + 汗出 + 恶风（脉象暂时不加）。
  // 不含喘判定：喘时(发热汗出恶风+喘) 桂枝汤与加厚朴杏仁汤同时输出，由使用者依经济/轻重取舍。
  // 但"仅喘、无桂枝证"不会定位到桂枝汤。
  needs: [
    ['fever.yes', 'sweat.yes', 'wind_aversion.yes', 'severe_thirst.no'],
    ['taiyang_disease.yes', 'sweat.yes', 'severe_thirst.no']
  ],
  contraindications: ['服后当啜热粥覆取微汗', '忌大汗（以遍身漐漐微似有汗为佳）', '服桂枝汤吐者其后恐吐脓血', '表实无汗发热者忌用（麻黄证忌）']
}

