module.exports = {
  name: 'fuzi_tang_furen',
  title: '附子汤（妊娠）',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妇人怀娠六七月，脉弦发热，其胎愈胀，腹痛恶寒者，少腹如扇，所以然者，子脏开故也，当以附子汤温其脏。
  needs: [
    ['pregnancy.yes', 'lower_abdomen_cold_fan.yes'],
    ['pregnancy.yes', 'abdominal_pain.yes', 'cold_aversion.yes']
  ],
  contraindications: ['治妊娠六七月而**小腹冷得像扇风一样**（原文：少腹如扇）、腹痛恶寒的情况', '病机是「子脏开」——胞宫虚寒、门户不固，所以要用附子汤温脏', '⚠ **附子有毒，且为妊娠慎用药**。原文用它，是因为「子脏开」属虚寒重证，必须严格遵医嘱，不可自行照方抓药', '本条历来有争议：有注家认为此「附子汤」非《伤寒论》的附子汤，方药已不可考']
}
