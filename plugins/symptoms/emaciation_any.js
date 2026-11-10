module.exports = {
  name: 'emaciation_any',
  title: '形体衰退（消瘦、脱发、白发）',
  kind: 'symptom_group',
  // 症状筛选组（状态）：形体衰退（消瘦、脱发、白发）
  trigger(text) { return ['消瘦', '瘦了', '掉头发', '脱发', '白发'].some(k => text.includes(k)) },
  ask: '是不是人瘦下去了、掉头发或者长白头发？',
  children: ['weight_loss', 'tuofa', 'baifa'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：乏力（归 energy_any）、食欲差（归食欲）']
}
