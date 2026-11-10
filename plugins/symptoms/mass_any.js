module.exports = {
  name: 'mass_any',
  title: '包块/肿块',
  kind: 'symptom_group',
  // 症状筛选组（部位）：包块/肿块
  trigger(text) { return ['包块', '肿块', '硬块', '硬结', '结块', '长了个'].some(k => text.includes(k)) },
  ask: '是不是身上能摸到包块、肿块或者硬结？',
  children: ['fixed_mass', 'hypochondriac_mass', 'lower_abdominal_lump', 'epigastric_mass_plate', 'abdomen_bulging_mass', 'rufangzhongkuai', 'gaihua_zhongkuai'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：水肿（是肿不是块）、关节肿大、淋巴结']
}
