module.exports = {
  name: 'guizhi_jia_shaoyao_tang',
  title: '桂枝加芍药汤',
  kind: 'formula',
  // 第279条: 本太阳病医反下之因尔腹满时痛者属太阴桂枝加芍药汤主之。
  // 太阴虚寒(误下伤脾),腹满+时痛(时作时止,喜按)。与加大黄汤区别在痛的性质(时痛虚 vs 大实痛实)。
  needs: [
    ['abdominal_fullness.yes', 'abdominal_pain.yes', 'severe_abdominal_pain.no']
  ],
  contraindications: ['腹满+时痛(太阴误下伤脾虚)', '时隐痛/喜按为虚', '大实痛拒按者宜桂枝加大黄', '温中缓急(桂枝芍药加倍)']
}
