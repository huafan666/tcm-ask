module.exports = {
  name: 'sini_jia_renshen_tang',
  title: '四逆加人参汤',
  kind: 'formula',
  // 385条：恶寒脉微而复利，利止亡血也，四逆加人参汤主之。
  needs: ['cold_aversion.yes', 'cold_extremities.yes', 'diarrhea.yes', 'poor_complexion.yes'],
  contraindications: ['385条：恶寒脉微而复利，利止亡血也', '四逆汤加人参，回阳之中兼顾津血', '⚠「利止」不是病愈——是津血已竭、无物可下，比下利不止更危', '与四逆汤的区别：本方多一个「亡血」（气色差、津血伤）']
}
