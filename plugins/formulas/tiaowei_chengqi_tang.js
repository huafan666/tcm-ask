module.exports = {
  name: 'tiaowei_chengqi_tang',
  title: '调胃承气汤',
  kind: 'formula',
  // 第105条: 伤寒十三日过经譫语者以有热也；若自下利脉调和此为内实，调胃承气汤主之。
  // 里实热(譫语、内实)。核心=譫语(里热)。
  needs: [
    ['delirium.yes', 'cold_drink_desire.yes', 'cold_aversion.no', 'poor_complexion.no'],
    ['fever.yes', 'heat_only_no_chill.yes', 'constipation.yes'],
    ['restless.yes', 'vomiting.no', 'diarrhea.no', 'cold_aversion.no']
  ],
  contraindications: ['譫语(里热实)', '调胃缓和通便', '热实内结用']
}
