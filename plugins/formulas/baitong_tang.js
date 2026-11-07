module.exports = {
  name: 'baitong_tang',
  title: '白通汤',
  kind: 'formula',
  // 第314条: 少阴病下利白通汤主之。第315条: 下利脉微者与白通汤。
  // 少阴阳衰寒利(下利+少阴+恶寒)。引阳通脉(葱白干姜附子)。
  needs: [
    ['diarrhea.yes', 'shaoyin.yes', 'cold_aversion.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['少阴下利+恶寒(阳衰寒利)', '下利清谷宜四逆汤', '通阳散寒(葱白干姜附子)', '下利不止厥逆无脉者白通加猪胆汁']
}
