module.exports = {
  name: 'cough_any',
  title: '咳嗽',
  kind: 'symptom_group',
  // 症状筛选组（动作）：咳嗽
  trigger(text) { return ['咳', '咳嗽', '干咳', '呛咳'].some(k => text.includes(k)) },
  ask: '是不是会咳嗽？',
  children: ['cough', 'qi_upward_cough'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：喘（呼吸急迫不是咳）、短气、喉咙痰鸣音']
}
