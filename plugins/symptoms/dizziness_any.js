module.exports = {
  name: 'dizziness_any',
  title: '头晕',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：头晕
  trigger(text) { return ['头晕', '眩晕', '头眩', '冒眩', '晕'].some(k => text.includes(k)) },
  ask: '是不是头晕、眼前发黑或者天旋地转？',
  children: ['dizziness', 'unsteady_stance'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：头痛（是痛不是晕）、耳鸣']
}
