module.exports = {
  name: 'hypochondrium_any',
  title: '胸胁（胸口和两侧肋骨下）不舒服',
  kind: 'symptom_group',
  // 症状筛选组（部位）：胸胁（胸口和两侧肋骨下）不舒服
  trigger(text) { return ['胁', '胸胁', '肋骨', '胸满', '胸闷', '胸口'].some(k => text.includes(k)) },
  ask: '是不是胸口或两侧肋骨下面（胸胁）不舒服——胀、满、痛、堵？',
  children: ['hypochondriac_fullness', 'hypochondriac_mass', 'hypochondriac_rush', 'hypochondriac_side_pain', 'zuolei_tong', 'left_leigu_suan', 'chest_fullness', 'chest_qi_stuffiness', 'chest_stuffy', 'chest_lump_hard', 'chest_indescribable', 'desire_to_press_chest'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：心口（心下）的痞满另算；乳房肿块、肺的问题']
}
