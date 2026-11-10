module.exports = {
  name: 'reproductive_state_any',
  title: '孕产状态',
  kind: 'symptom_group',
  // 症状筛选组（状态）：孕产状态
  trigger(text) { return ['怀孕', '妊娠', '产后', '坐月子', '生完'].some(k => text.includes(k)) },
  ask: '是不是正在怀孕，或者刚生完孩子？',
  children: ['pregnancy', 'postpartum'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：这是状态不是异常；孕吐、恶露等另有专门症状']
}
