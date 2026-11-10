module.exports = {
  name: 'energy_any',
  title: '乏力/身重',
  kind: 'symptom_group',
  // 症状筛选组（状态）：乏力/身重
  trigger(text) { return ['没劲', '乏力', '提不起', '身重', '发沉', '体力'].some(k => text.includes(k)) },
  ask: '是不是没劲、提不起精神，或者身上发沉？',
  children: ['low_energy', 'tili_cha', 'body_heavy'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：气短（归喘类）、嗜睡（归睡眠）、四肢沉重抬不动（归肢体）']
}
