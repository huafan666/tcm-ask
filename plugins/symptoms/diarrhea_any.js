module.exports = {
  name: 'diarrhea_any',
  title: '下利（大便稀薄、次数多）',
  kind: 'symptom_group',
  // 症状筛选组（动作）：下利（大便稀薄、次数多）
  trigger(text) { return ['下利', '拉肚', '泄泻', '腹泻', '便溏', '溏泄', '拉稀', '一天拉'].some(k => text.includes(k)) },
  ask: '是不是拉肚子——大便稀、不成形或者次数多？',
  children: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：便血/黑便（那是出血不是下利）、便秘（相反）、下坠感']
}
