module.exports = {
  name: 'abdomen_any',
  title: '腹部（肚子）不舒服',
  kind: 'symptom_group',
  // 症状筛选组（部位）：腹部（肚子）不舒服
  trigger(text) { return ['腹', '肚子', '小肚', '心口', '胃这块', '脐'].some(k => text.includes(k)) },
  ask: '是不是肚子（腹部、小肚子）不舒服——胀、痛、紧、有块？',
  children: ['abdominal_fullness', 'abdominal_pain', 'abdominal_tension', 'abdominal_cramp_after_birth', 'circumumbilical_pain', 'duzijiaotonghuocitong', 'severe_abdominal_pain', 'fubulentong', 'lower_abdomen_cramp', 'lower_abdomen_swelling_pain', 'lower_abdominal_lump', 'epigastric_fullness', 'epigastric_lump_soft', 'epigastric_mass_plate', 'epigastric_pressing_pain', 'press_only_pain', 'press_pain_aggravated', 'full_epigastric_hard_pain', 'abdomen_bulging_mass', 'left_abdomen_press_pain', 'borborygmus', 'flatus', 'chongji', 'wei_tong'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：胸胁（位置更高）、腰、固定包块（位置不定，不归腹部）']
}
