module.exports = {
  name: 'pain_any',
  title: '疼痛',
  kind: 'symptom_group',
  // 症状筛选组（部位）：疼痛
  trigger(text) { return ['痛', '疼', '酸痛', '刺痛', '绞痛', '剧痛', '隐痛', '胀痛'].some(k => text.includes(k)) },
  ask: '是不是身上有疼痛——不管哪个部位？',
  children: ['abdominal_pain', 'abdominal_cramp_after_birth', 'chest_back_pain', 'circumumbilical_pain', 'duzijiaotonghuocitong', 'epigastric_pressing_pain', 'fengchi_tong', 'full_epigastric_hard_pain', 'heart_bind_pain', 'heart_hanging_pain', 'heart_pain_radiate', 'hypochondriac_side_pain', 'jiao_qi_pain', 'joint_pain_rigid', 'joint_pain_severe', 'left_abdomen_press_pain', 'lower_abdomen_swelling_pain', 'lower_abdominal_lump', 'neck_stiff_pain', 'press_only_pain', 'press_pain_aggravated', 'severe_abdominal_pain', 'throat_pain', 'tongjing', 'wei_tong', 'yaguan_tong', 'body_pain', 'body_ache_stiff', 'cough_pleuritic_pain', 'zuolei_tong', 'zugengtong', 'danjieshidianyatong', 'migratory_pain'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：腰酸/肋酸（酸不是痛）、肚子拘急发紧（紧不是痛）、麻木、酸困']
}
