module.exports = {
  name: 'guizhi_mahuang_geban_tang',
  title: '桂枝麻黄各半汤',
  kind: 'formula',
  // 23条：太阳病，得之八九日，如疟状，发热恶寒，热多寒少，其人不呕，清便欲自可，一日二三度发……面色反有热色者，未欲解也，以其不能得小汗出，身必痒，宜桂枝麻黄各半汤。
  needs: [
    ['fever.yes', 'cold_aversion.yes', 'sweat.no', 'skin_itch_hives.yes'],
    ['fever.yes', 'cold_aversion.yes', 'no_sweat.yes', 'vomiting.no', 'periodic_chill_fever.yes']
  ],
  contraindications: ['23条：如疟状、发热恶寒、热多寒少，不呕，清便自可，一日二三度发', '原文抓手：「不能得小汗出，身必痒」——表郁不解、汗欲出而不得出', '桂枝汤与麻黄汤各取三分之一，小发其汗，不可大发', '脉微而恶寒者属阴阳俱虚，不可更发汗、更下、更吐，非本方证']
}
