module.exports = {
  name: 'houshi_heisan',
  title: '侯氏黑散',
  kind: 'formula',
  // 金匮要略·中风历节病脉证并治第五：侯氏黑散治大风四肢烦重，心中恶寒不足者。
  needs: [
    ['limb_heavy_powerless.yes', 'heart_cold_weak.yes'],
    ['body_heavy.yes', 'heart_cold_weak.yes']
  ],
  contraindications: ['治「大风」——肢体沉重烦扰、同时心里发冷、觉得虚（正气不足）', '方子寒热并用：菊花、防风、细辛祛风，人参、白术、茯苓补气，当归、川芎养血，桔梗、矾石化痰', '原法要求用温酒调服，并且忌一切鱼肉大蒜，常宜冷食（让药力在腹中停留）', '适合正虚兼风邪的中风轻证，不是急救方']
}
