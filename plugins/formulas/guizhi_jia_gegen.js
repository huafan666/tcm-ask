module.exports = {
  name: 'guizhi_jia_gegen',
  title: '桂枝加葛根汤',
  kind: 'formula',
  // 第14条: 太阳病，项背强几几，反汗出恶风者，桂枝加葛根汤主之。
  // 变方 = 桂枝汤证(发热汗出恶风) + 项背强几几
  needs: [
    ['fever.yes', 'sweat.yes', 'wind_aversion.yes', 'neck_stiff_pain.yes', 'severe_thirst.no'],
    ['fever.yes', 'sweat.yes', 'neck_stiff_pain.yes', 'severe_thirst.no']
  ],
  contraindications: ['解肌发表，生津舒筋', '针对项背强几几(后项背僵硬)', '表实无汗者不宜（须有汗出恶风）']
}

