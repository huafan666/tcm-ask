module.exports = {
  name: 'dajianzhong_tang',
  title: '大建中汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：心胸中大寒痛，呕不能饮食，腹中满，上冲皮起，出见有头足，上下痛而不可触近，大建中汤主之。
  needs: [
    ['abdomen_bulging_mass.yes', 'severe_abdominal_pain.yes'],
    ['abdomen_bulging_mass.yes', 'vomiting.yes'],
    ['severe_abdominal_pain.yes', 'vomiting.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治「大寒痛」：心胸腹部剧烈冷痛，呕吐得吃不下，肚子胀满', '最形象的一句话是「上冲皮起，出见有头足」——寒气攻冲时肚皮鼓起一块、形状像有头有脚，还会上下移动', '「不可触近」——痛得连碰都不让碰，是寒气极盛的表现', '蜀椒、干姜大辛大热温中散寒，人参、饴糖补中缓急；原文要求「分温再服」，且服后「当一日食糜」——当天只吃稀粥', '⚠ 这种剧痛伴腹部包块，必须先排除肠梗阻、肠套叠等急腹症']
}
