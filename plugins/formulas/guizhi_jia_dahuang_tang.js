module.exports = {
  name: 'guizhi_jia_dahuang_tang',
  title: '桂枝加大黄汤',
  kind: 'formula',
  // 第279条: 大实痛者桂枝加大黄汤主之。
  // 太阴误下但大实痛(拒按剧痛,夹瘀/实)。与加芍药汤区别: 本证腹痛拒按而甚。
  needs: [
    ['abdominal_fullness.yes', 'severe_abdominal_pain.yes']
  ],
  contraindications: ['腹满+大实痛(拒按剧痛)', '时隐痛/喜按者宜桂枝加芍药', '脉弱续自便利者减大黄芍药(280)', '通便止痛']
}
