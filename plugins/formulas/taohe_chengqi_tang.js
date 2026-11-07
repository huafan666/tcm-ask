module.exports = {
  name: 'taohe_chengqi_tang',
  title: '桃核承气汤',
  kind: 'formula',
  // 第106条: 太阳病不解热结膀胱，其人如狂，血自下者愈，外解已但少腹急结者乃可攻之，宜桃核承气汤。
  // 蓄血证: 少腹急结+如狂。核心=少腹急结(蓄血)+如狂。
  needs: [
    ['lower_abdominal_lump.yes', 'manic.yes', 'cold_aversion.no', 'poor_complexion.no'],
    ['lower_abdominal_lump.yes', 'cold_aversion.no', 'poor_complexion.no']
  ],
  contraindications: ['少腹急结(蓄血)', '其人或如狂', '外解后方可攻血', '下瘀血']
}
