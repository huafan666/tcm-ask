module.exports = {
  name: 'cold_any',
  title: '寒冷感（怕冷、发冷、身上凉）',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：寒冷感（怕冷、发冷、身上凉）
  trigger(text) { return ['怕冷', '发冷', '恶寒', '畏寒', '冷', '凉'].some(k => text.includes(k)) },
  ask: '是不是觉得冷——怕冷、发冷，或者某个部位发凉？',
  children: ['cold_aversion', 'wind_aversion', 'mild_cold', 'back_cold_patch', 'genital_cold', 'lower_back_cold', 'lower_leg_cold', 'xigaiyixialeng', 'lower_abdomen_cold_fan', 'heart_cold_weak', 'chill_predominant', 'cold_extremities'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：恶风（怕风与怕冷不同，但都记在这里便于粗筛）；喜冷饮（那是饮食偏好）']
}
