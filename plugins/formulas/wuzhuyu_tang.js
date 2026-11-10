module.exports = {
  name: 'wuzhuyu_tang',
  title: '吴茱萸汤',
  kind: 'formula',
  // 吴茱萸汤六经通用,主治中焦虚寒、浊阴上逆、胃寒呕吐:
  //   243(阳明): 食谷欲呕属阳明,得汤反剧者属上焦
  //   309(少阴): 吐利,手足逆冷,烦躁欲死
  //   378(厥阴): 干呕,吐涎沫,头痛
  // 核心=虚寒上逆之呕(食谷欲呕/干呕吐涎沫/吐利逆冷烦躁)。
  needs: [
    ['vomit_on_food.yes', 'cold_drink_desire.no'],
    ['vomit_saliva.yes', 'cold_drink_desire.no'],
    ['cold_extremities.yes', 'restless.yes', 'diarrhea.yes', 'cold_drink_desire.no'],
    // 金匮 17.10/17.11：呕而胸满者、干呕吐涎沫头痛者，茱萸汤主之
    ['vomiting.yes', 'chest_fullness.yes'],
    ['vomiting.yes', 'saliva_spit.yes', 'cold_extremities.yes'],
    // 378条：干呕，吐涎沫，头痛者 —— 厥阴头痛是这条的特异点
    ['vomiting.yes', 'saliva_spit.yes', 'headache.yes']
  ],
  contraindications: ['食谷欲呕(胃中虚寒)', '干呕吐涎沫头痛(厥阴)', '吐利手足逆冷烦躁(少阴)', '得汤反剧者属上焦勿用', '温中降逆(吴茱萸生姜人参大枣)', '胃寒的原因可能是出汗之后，或者外感病（太阳病）之后又出汗导致胃里面寒掉；', '胃寒的第二个原因可能是吃东西造成的，具体有甜食（主要指白糖类：蛋糕、蛋挞、可乐和黑森林）和咖啡']
}
